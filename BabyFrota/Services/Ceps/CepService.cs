using System.Net.Http.Json;
using System.Text.Json.Serialization;
using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Ceps;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BabyFrota.Services.Ceps;

public class CepService : ICepService
{
    private readonly AppDbContext _db;
    private readonly HttpClient _httpClient;
    private readonly ILogger<CepService> _logger;

    public CepService(AppDbContext db, IHttpClientFactory httpClientFactory, ILogger<CepService> logger)
    {
        _db = db;
        _httpClient = httpClientFactory.CreateClient("ViaCep");
        _logger = logger;
    }

    public async Task<CepDto?> ConsultarAsync(string cep, CancellationToken ct = default)
    {
        var digitos = new string(cep.Where(char.IsDigit).ToArray());
        if (digitos.Length != 8 || !int.TryParse(digitos, out var cepNumero))
            throw new ArgumentException("CEP inválido — informe 8 dígitos.");

        var existente = await _db.Ceps
            .Include(c => c.CdbairroNavigation).ThenInclude(b => b.CdlocalidadeNavigation).ThenInclude(l => l.CdufNavigation)
            .FirstOrDefaultAsync(c => c.Cep1 == cepNumero, ct);

        if (existente is not null)
        {
            return new CepDto
            {
                Cep = digitos,
                Logradouro = existente.Logradouro,
                Bairro = existente.CdbairroNavigation.Bairro1,
                Cidade = existente.CdbairroNavigation.CdlocalidadeNavigation.Localidade1,
                Uf = existente.CdbairroNavigation.CdlocalidadeNavigation.CdufNavigation.Uf1,
            };
        }

        return await BuscarNoViaCepECadastrarAsync(digitos, cepNumero, ct);
    }

    /// <summary>
    /// Réplica do fallback do CEPFacil.cs legado: consulta o ViaCEP e, em cascata, garante que
    /// Localidade/Bairro/CEP existam na base local (criando o que faltar) para não bater no
    /// serviço externo de novo na próxima consulta do mesmo CEP.
    /// </summary>
    private async Task<CepDto?> BuscarNoViaCepECadastrarAsync(string cepDigitos, int cepNumero, CancellationToken ct)
    {
        ViaCepResponse? resposta;
        try
        {
            resposta = await _httpClient.GetFromJsonAsync<ViaCepResponse>($"{cepDigitos}/json/", ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao consultar o ViaCEP para {Cep}.", cepDigitos);
            return null;
        }

        if (resposta is null || resposta.Erro || string.IsNullOrWhiteSpace(resposta.Uf))
            return null; // CEP não existe

        var uf = await _db.Ufs.FirstOrDefaultAsync(u => u.Uf1 == resposta.Uf, ct)
            ?? throw new InvalidOperationException($"UF '{resposta.Uf}' não está cadastrada na base local.");

        var nomeLocalidade = resposta.Localidade ?? string.Empty;
        var localidade = await _db.Localidades
            .FirstOrDefaultAsync(l => l.Localidade1 == nomeLocalidade && l.Cduf == uf.Cduf, ct);

        if (localidade is null)
        {
            localidade = new Localidade { Localidade1 = nomeLocalidade, Cduf = uf.Cduf, Ddd = 0 };
            _db.Localidades.Add(localidade);
            await _db.SaveChangesAsync(ct);
        }

        var nomeBairro = resposta.Bairro ?? string.Empty;
        if (nomeBairro.Length > 40)
            nomeBairro = nomeBairro[..40];

        var bairro = await _db.Bairros
            .FirstOrDefaultAsync(b => b.Bairro1 == nomeBairro && b.Cdlocalidade == localidade.Cdlocalidade, ct);

        if (bairro is null)
        {
            bairro = new Bairro { Bairro1 = nomeBairro, Cdlocalidade = localidade.Cdlocalidade };
            _db.Bairros.Add(bairro);
            await _db.SaveChangesAsync(ct);
        }

        var novoCep = new Cep
        {
            Cep1 = cepNumero,
            Cdbairro = bairro.Cdbairro,
            Logradouro = resposta.Logradouro ?? string.Empty,
            Statualizado = true,
            Stbloqueado = false,
        };
        _db.Ceps.Add(novoCep);
        await _db.SaveChangesAsync(ct);

        return new CepDto
        {
            Cep = cepDigitos,
            Logradouro = novoCep.Logradouro,
            Bairro = nomeBairro,
            Cidade = nomeLocalidade,
            Uf = uf.Uf1,
        };
    }

    private class ViaCepResponse
    {
        [JsonPropertyName("logradouro")] public string? Logradouro { get; set; }
        [JsonPropertyName("bairro")] public string? Bairro { get; set; }
        [JsonPropertyName("localidade")] public string? Localidade { get; set; }
        [JsonPropertyName("uf")] public string? Uf { get; set; }
        [JsonPropertyName("erro")] public bool Erro { get; set; }
    }
}
