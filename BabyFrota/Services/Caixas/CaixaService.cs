using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Caixa;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Caixas;

public class CaixaService : ICaixaService
{
    private readonly AppDbContext _db;

    public CaixaService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<CaixaMovimentoDto?> ObterAbertoAsync(CancellationToken ct = default)
    {
        var aberto = await ObterEntidadeAbertaAsync(ct);
        return aberto is null ? null : await ParaDtoAsync(aberto, ct);
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

        return await ParaDtoAsync(caixa, ct);
    }

    public async Task<CaixaMovimentoDto> FecharAsync(int usuarioId, FechamentoCaixaRequest request, CancellationToken ct = default)
    {
        var caixa = await ObterEntidadeAbertaAsync(ct)
            ?? throw new InvalidOperationException("Não há caixa aberto para fechar.");

        caixa.Dtfechamento = DateTime.Now;
        caixa.CdusuarioFechamento = usuarioId;
        caixa.ValorFechamento = request.ValorFechamento;

        await _db.SaveChangesAsync(ct);

        return await ParaDtoAsync(caixa, ct);
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

    private async Task<CaixaMovimentoDto> ParaDtoAsync(CaixaMovimento caixa, CancellationToken ct)
    {
        var totalSuprimentos = await _db.Suprimentos
            .Where(s => s.CdcaixaMovimento == caixa.CdcaixaMovimento)
            .SumAsync(s => (decimal?)s.Valor, ct) ?? 0m;

        var totalSangrias = await _db.Sangrias
            .Where(s => s.CdcaixaMovimento == caixa.CdcaixaMovimento)
            .SumAsync(s => (decimal?)s.Valor, ct) ?? 0m;

        var totalLocacoes = await _db.Locacoes
            .Where(l => l.CdcaixaMovimento == caixa.CdcaixaMovimento)
            .SumAsync(l => (decimal?)l.ValorTotal, ct) ?? 0m;

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
            UsuarioAberturaNome = usuarioAbertura,
            UsuarioFechamentoNome = usuarioFechamento,
            SuprimentoInicial = caixa.SuprimentoInicial,
            ValorFechamento = caixa.ValorFechamento,
            Aberto = caixa.Dtfechamento == null,
            TotalSuprimentos = totalSuprimentos,
            TotalSangrias = totalSangrias,
            TotalLocacoes = totalLocacoes,
            SaldoAtual = caixa.SuprimentoInicial + totalLocacoes + totalSuprimentos - totalSangrias,
        };
    }
}
