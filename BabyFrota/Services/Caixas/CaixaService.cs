using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Caixa;
using BabyFrota.Services.Common;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Caixas;

public class CaixaService : ICaixaService
{
    private readonly AppDbContext _db;
    private readonly ApuradorCaixa _apurador;

    public CaixaService(AppDbContext db)
    {
        _db = db;
        _apurador = new ApuradorCaixa(db);
    }

    public async Task<CaixaMovimentoDto?> ObterAbertoAsync(int usuarioId, CancellationToken ct = default)
    {
        var aberto = await ObterEntidadeAbertaAsync(ct);
        return aberto is null ? null : await ParaDtoAsync(aberto, usuarioId, ct);
    }

    public async Task<CaixaMovimentoDto> AbrirAsync(int usuarioId, AberturaCaixaRequest request, CancellationToken ct = default)
    {
        var jaAberto = await ObterEntidadeAbertaAsync(ct);
        if (jaAberto is not null)
            throw new InvalidOperationException("Já existe um caixa aberto. Feche-o antes de abrir um novo.");

        var caixa = new CaixaMovimento
        {
            Dtabertura = DateTime.Now,
            CdusuarioAbertura = usuarioId,
            SuprimentoInicial = request.SuprimentoInicial,
        };

        _db.CaixaMovimentos.Add(caixa);
        await _db.SaveChangesAsync(ct);

        return await ParaDtoAsync(caixa, usuarioId, ct);
    }

    public async Task<CaixaMovimentoDto> FecharAsync(int usuarioId, CancellationToken ct = default)
    {
        var caixa = await ObterEntidadeAbertaAsync(ct)
            ?? throw new InvalidOperationException("Não há caixa aberto para fechar.");

        // O legado deixa qualquer usuário fechar o caixa de qualquer outro. Aqui só quem abriu fecha o próprio,
        // e Gerente ou Administrador podem fechar o de outra pessoa (turno que acabou sem fechar).
        if (!await PodeFecharAsync(caixa, usuarioId, ct))
            throw new AcessoNegadoException("Somente quem abriu o caixa, um Gerente ou um Administrador pode fechá-lo.");

        var apuracao = (await _apurador.ApurarAsync([CaixaBaseDe(caixa)], ct))[caixa.CdcaixaMovimento];

        // Igual ao legado (NLocacao.TotalCaixa): o pagamento só é recebido na devolução, então fechar com
        // carrinhos ainda na rua deixaria o dinheiro dessas locações fora do fechamento.
        if (apuracao.LocacoesPendentes > 0)
            throw new InvalidOperationException(
                $"Existem {apuracao.LocacoesPendentes} devoluções pendentes. Registre as devoluções antes de fechar o caixa.");

        caixa.Dtfechamento = DateTime.Now;
        caixa.CdusuarioFechamento = usuarioId;
        // Como no legado (NCaixaMovimento.FecharCaixa), não há valor digitado: grava o total vendido apurado pelo sistema.
        caixa.ValorFechamento = apuracao.TotalVendido;

        await _db.SaveChangesAsync(ct);

        return await ParaDtoAsync(caixa, usuarioId, ct);
    }

    public async Task<MovimentoCaixaDto> RegistrarSuprimentoAsync(int usuarioId, decimal valor, CancellationToken ct = default)
    {
        var caixa = await ObterEntidadeAbertaAsync(ct)
            ?? throw new InvalidOperationException("Não há caixa aberto — abra o caixa antes de lançar suprimentos.");

        var suprimento = new Suprimento
        {
            CdcaixaMovimento = caixa.CdcaixaMovimento,
            Cdusuario = usuarioId,
            Dtsuprimento = DateTime.Now,
            Valor = valor,
        };
        _db.Suprimentos.Add(suprimento);
        await _db.SaveChangesAsync(ct);

        return await _db.Suprimentos
            .Where(s => s.Cdsuprimento == suprimento.Cdsuprimento)
            .Select(s => new MovimentoCaixaDto
            {
                Id = s.Cdsuprimento,
                Data = s.Dtsuprimento,
                Valor = s.Valor,
                UsuarioNome = s.CdusuarioNavigation.Nome,
            })
            .FirstAsync(ct);
    }

    public async Task<MovimentoCaixaDto> RegistrarSangriaAsync(int usuarioId, decimal valor, CancellationToken ct = default)
    {
        var caixa = await ObterEntidadeAbertaAsync(ct)
            ?? throw new InvalidOperationException("Não há caixa aberto — abra o caixa antes de lançar sangrias.");

        var sangria = new Sangria
        {
            CdcaixaMovimento = caixa.CdcaixaMovimento,
            Cdusuario = usuarioId,
            Dtsangria = DateTime.Now,
            Valor = valor,
        };
        _db.Sangrias.Add(sangria);
        await _db.SaveChangesAsync(ct);

        return await _db.Sangrias
            .Where(s => s.Cdsangria == sangria.Cdsangria)
            .Select(s => new MovimentoCaixaDto
            {
                Id = s.Cdsangria,
                Data = s.Dtsangria,
                Valor = s.Valor,
                UsuarioNome = s.CdusuarioNavigation.Nome,
            })
            .FirstAsync(ct);
    }

    public async Task<List<MovimentoCaixaDto>> ListarSuprimentosAsync(CancellationToken ct = default)
    {
        var caixa = await ObterEntidadeAbertaAsync(ct);
        if (caixa is null)
            return [];

        return await _db.Suprimentos
            .Where(s => s.CdcaixaMovimento == caixa.CdcaixaMovimento)
            .OrderByDescending(s => s.Dtsuprimento)
            .Select(s => new MovimentoCaixaDto
            {
                Id = s.Cdsuprimento,
                Data = s.Dtsuprimento,
                Valor = s.Valor,
                UsuarioNome = s.CdusuarioNavigation.Nome,
            })
            .ToListAsync(ct);
    }

    public async Task<List<MovimentoCaixaDto>> ListarSangriasAsync(CancellationToken ct = default)
    {
        var caixa = await ObterEntidadeAbertaAsync(ct);
        if (caixa is null)
            return [];

        return await _db.Sangrias
            .Where(s => s.CdcaixaMovimento == caixa.CdcaixaMovimento)
            .OrderByDescending(s => s.Dtsangria)
            .Select(s => new MovimentoCaixaDto
            {
                Id = s.Cdsangria,
                Data = s.Dtsangria,
                Valor = s.Valor,
                UsuarioNome = s.CdusuarioNavigation.Nome,
            })
            .ToListAsync(ct);
    }

    private async Task<CaixaMovimento?> ObterEntidadeAbertaAsync(CancellationToken ct)
    {
        return await _db.CaixaMovimentos
            .Where(c => c.Dtfechamento == null)
            .OrderByDescending(c => c.Dtabertura)
            .FirstOrDefaultAsync(ct);
    }

    private static CaixaBase CaixaBaseDe(CaixaMovimento caixa)
        => new(caixa.CdcaixaMovimento, caixa.Dtabertura, caixa.SuprimentoInicial, caixa.CdusuarioAbertura);

    private async Task<bool> PodeFecharAsync(CaixaMovimento caixa, int usuarioId, CancellationToken ct)
    {
        if (caixa.Dtfechamento is not null)
            return false;

        return caixa.CdusuarioAbertura == usuarioId
            || PerfilUsuarioExtensions.EhSupervisor(await _db.ObterPerfilIdAsync(usuarioId, ct));
    }

    private async Task<CaixaMovimentoDto> ParaDtoAsync(CaixaMovimento caixa, int usuarioId, CancellationToken ct)
    {
        var apuracao = (await _apurador.ApurarAsync([CaixaBaseDe(caixa)], ct))[caixa.CdcaixaMovimento];

        var usuarioAbertura = await _db.Usuarios
            .Where(u => u.Cdusuario == caixa.CdusuarioAbertura)
            .Select(u => u.Nome)
            .FirstOrDefaultAsync(ct) ?? string.Empty;

        string? usuarioFechamento = null;
        if (caixa.CdusuarioFechamento.HasValue)
        {
            usuarioFechamento = await _db.Usuarios
                .Where(u => u.Cdusuario == caixa.CdusuarioFechamento.Value)
                .Select(u => u.Nome)
                .FirstOrDefaultAsync(ct);
        }

        return new CaixaMovimentoDto
        {
            Id = caixa.CdcaixaMovimento,
            DataAbertura = caixa.Dtabertura,
            DataFechamento = caixa.Dtfechamento,
            UsuarioAberturaId = caixa.CdusuarioAbertura,
            UsuarioAberturaNome = usuarioAbertura,
            UsuarioFechamentoNome = usuarioFechamento,
            SuprimentoInicial = caixa.SuprimentoInicial,
            ValorFechamento = caixa.ValorFechamento,
            Aberto = caixa.Dtfechamento == null,
            TotalSuprimentos = apuracao.Reforcos,
            TotalSangrias = apuracao.TotalGastos,
            TotalLocacoes = apuracao.TotalVendido,
            PorForma = new Dictionary<int, decimal>(apuracao.PorForma),
            LocacoesPendentes = apuracao.LocacoesPendentes,
            SaldoEmDinheiro = apuracao.SaldoEmDinheiro,
            PodeFechar = await PodeFecharAsync(caixa, usuarioId, ct),
        };
    }
}
