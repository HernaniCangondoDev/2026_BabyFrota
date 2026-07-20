using BabyFrota.DTOs.Ceps;

namespace BabyFrota.Services.Ceps;

public interface ICepService
{
    /// <summary>
    /// Busca o CEP na base local; se não existir, consulta o ViaCEP e cadastra localidade,
    /// bairro e CEP automaticamente (mesmo fluxo do CEPFacil.cs do sistema legado — só que
    /// trocando o WebClient/XML por HttpClient/JSON). Retorna null se o CEP realmente não existir.
    /// </summary>
    Task<CepDto?> ConsultarAsync(string cep, CancellationToken ct = default);
}
