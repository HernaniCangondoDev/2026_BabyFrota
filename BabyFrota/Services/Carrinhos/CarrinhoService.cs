using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Carrinhos;
using BabyFrota.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Carrinhos;

public class CarrinhoService : ICarrinhoService
{
    private readonly AppDbContext _db;

    public CarrinhoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<CarrinhoDto>> ListarAsync(
        string? descricao, int? statusId, int? tipoCarrinhoId, int pagina, int tamanhoPagina, CancellationToken ct = default)
    {
        pagina = pagina < 1 ? 1 : pagina;
        tamanhoPagina = tamanhoPagina is < 1 or > 500 ? 10 : tamanhoPagina;

        var query = _db.Carrinhos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(descricao))
            query = query.Where(c => c.Descricao.Contains(descricao));

        if (statusId.HasValue)
            query = query.Where(c => c.Cdstatus == statusId);

        if (tipoCarrinhoId.HasValue)
            query = query.Where(c => c.CdtipoCarrinho == tipoCarrinhoId);

        var total = await query.CountAsync(ct);

        // Projeção inline (não uma chamada a método) para o EF Core conseguir traduzir em SQL.
        var itens = await query
            .OrderBy(c => c.Descricao)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .Select(c => new CarrinhoDto
            {
                Id = c.Cdcarrinho,
                Descricao = c.Descricao,
                TipoCarrinhoId = c.CdtipoCarrinho,
                TipoCarrinhoDescricao = c.CdtipoCarrinhoNavigation.Descricao,
                StatusId = c.Cdstatus,
                StatusNome = c.CdstatusNavigation.Nome,
                DataAquisicao = c.Dtaquisicao,
                Fornecedor = c.Fornecedor,
                ValorAquisicao = c.ValorAquisicao,
                Observacao = c.Observacao,
                DataCadastro = c.DataCadastro,
            })
            .ToListAsync(ct);

        return new PagedResult<CarrinhoDto>
        {
            Itens = itens,
            Pagina = pagina,
            TamanhoPagina = tamanhoPagina,
            TotalRegistros = total,
        };
    }

    public async Task<CarrinhoDto?> ObterPorIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Carrinhos
            .Where(c => c.Cdcarrinho == id)
            .Select(c => new CarrinhoDto
            {
                Id = c.Cdcarrinho,
                Descricao = c.Descricao,
                TipoCarrinhoId = c.CdtipoCarrinho,
                TipoCarrinhoDescricao = c.CdtipoCarrinhoNavigation.Descricao,
                StatusId = c.Cdstatus,
                StatusNome = c.CdstatusNavigation.Nome,
                DataAquisicao = c.Dtaquisicao,
                Fornecedor = c.Fornecedor,
                ValorAquisicao = c.ValorAquisicao,
                Observacao = c.Observacao,
                DataCadastro = c.DataCadastro,
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<CarrinhoDto> CriarAsync(CarrinhoUpsertRequest request, CancellationToken ct = default)
    {
        await ValidarReferenciasAsync(request, ct);

        var entidade = new Carrinho
        {
            Descricao = request.Descricao,
            CdtipoCarrinho = request.TipoCarrinhoId,
            Cdstatus = request.StatusId,
            Dtaquisicao = request.DataAquisicao,
            Fornecedor = request.Fornecedor,
            ValorAquisicao = request.ValorAquisicao,
            Observacao = request.Observacao,
            DataCadastro = DateTime.Now,
        };

        _db.Carrinhos.Add(entidade);
        await _db.SaveChangesAsync(ct);

        return await ObterPorIdAsync(entidade.Cdcarrinho, ct)
            ?? throw new InvalidOperationException("Falha ao recarregar carrinho recém-criado.");
    }

    public async Task<CarrinhoDto> AtualizarAsync(int id, CarrinhoUpsertRequest request, CancellationToken ct = default)
    {
        var entidade = await _db.Carrinhos.FirstOrDefaultAsync(c => c.Cdcarrinho == id, ct)
            ?? throw new KeyNotFoundException($"Carrinho {id} não encontrado.");

        await ValidarReferenciasAsync(request, ct);

        entidade.Descricao = request.Descricao;
        entidade.CdtipoCarrinho = request.TipoCarrinhoId;
        entidade.Cdstatus = request.StatusId;
        entidade.Dtaquisicao = request.DataAquisicao;
        entidade.Fornecedor = request.Fornecedor;
        entidade.ValorAquisicao = request.ValorAquisicao;
        entidade.Observacao = request.Observacao;
        entidade.DataAlteracao = DateTime.Now;

        await _db.SaveChangesAsync(ct);

        return await ObterPorIdAsync(id, ct)
            ?? throw new InvalidOperationException("Falha ao recarregar carrinho atualizado.");
    }

    public async Task ExcluirAsync(int id, CancellationToken ct = default)
    {
        var entidade = await _db.Carrinhos.FirstOrDefaultAsync(c => c.Cdcarrinho == id, ct)
            ?? throw new KeyNotFoundException($"Carrinho {id} não encontrado.");

        var possuiLocacoes = await _db.Locacoes.AnyAsync(l => l.Cdcarrinho == id, ct);
        if (possuiLocacoes)
            throw new InvalidOperationException(
                "Não é possível excluir um carrinho com locações registradas. Considere marcá-lo como 'Manutenção'.");

        _db.Carrinhos.Remove(entidade);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<StatusDto>> ListarStatusAsync(CancellationToken ct = default)
    {
        return await _db.Statuses
            .OrderBy(s => s.Cdstatus)
            .Select(s => new StatusDto { Id = s.Cdstatus, Nome = s.Nome })
            .ToListAsync(ct);
    }

    private async Task ValidarReferenciasAsync(CarrinhoUpsertRequest request, CancellationToken ct)
    {
        var tipoExiste = await _db.TipoCarrinhos.AnyAsync(t => t.CdtipoCarrinho == request.TipoCarrinhoId, ct);
        if (!tipoExiste)
            throw new ArgumentException("Tipo de carrinho informado não existe.");

        var statusExiste = await _db.Statuses.AnyAsync(s => s.Cdstatus == request.StatusId, ct);
        if (!statusExiste)
            throw new ArgumentException("Status informado não existe.");
    }
}
