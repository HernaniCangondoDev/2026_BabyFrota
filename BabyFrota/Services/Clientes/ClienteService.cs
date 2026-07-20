using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Clientes;
using BabyFrota.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Clientes;

public class ClienteService : IClienteService
{
    private readonly AppDbContext _db;

    public ClienteService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Paginado no servidor: a tabela Cliente é uma tabela de produção com muitos registros —
    /// buscar tudo de uma vez (como a primeira versão fazia) deixava a listagem "pendurada" no
    /// front. A listagem também NÃO traz a lista detalhada de Filhos (só a contagem) — trazer a
    /// coleção aninhada por linha, mesmo paginado, gera uma subquery correlacionada cara demais
    /// para uma tabela grande; o detalhe completo (com Filhos) só é buscado ao abrir o modal de
    /// edição, via ObterPorIdAsync.
    /// </summary>
    public async Task<PagedResult<ClienteDto>> ListarAsync(
        string? nome, string? cpf, int pagina, int tamanhoPagina, CancellationToken ct = default)
    {
        pagina = pagina < 1 ? 1 : pagina;
        tamanhoPagina = tamanhoPagina is < 1 or > 500 ? 10 : tamanhoPagina;

        var query = _db.Clientes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(nome))
            query = query.Where(c => c.Nome.Contains(nome));

        if (!string.IsNullOrWhiteSpace(cpf))
            query = query.Where(c => c.Cpf.Contains(cpf));

        var total = await query.CountAsync(ct);

        // Projeção inline (não uma chamada a método) para o EF Core conseguir traduzir em SQL.
        var itens = await query
            .OrderBy(c => c.Nome)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .Select(c => new ClienteDto
            {
                Id = c.Cdcliente,
                Nome = c.Nome,
                Cpf = c.Cpf,
                Rg = c.Rg,
                Ddd = c.Dddtelefone,
                Telefone = c.Telefone,
                DddCelular = c.Dddcelular,
                Celular = c.Celular,
                Email = c.Email,
                Cep = c.Cep,
                Logradouro = c.Logradouro,
                Numero = c.Nrlogradouro,
                Complemento = c.Complemento,
                Cidade = c.Cidade,
                Uf = c.Uf,
                DataNascimento = c.Dtnascimento,
                Profissao = c.Profissao,
                ClasseSocial = c.ClasseSocial,
                Sexo = c.Tpsexo,
                Observacao = c.Observacao,
                DataCadastro = c.DataCadastro,
                QuantidadeFilhos = c.Filhos.Count,
                QuantidadeLocacoes = c.Locacoes.Count,
            })
            .ToListAsync(ct);

        return new PagedResult<ClienteDto>
        {
            Itens = itens,
            Pagina = pagina,
            TamanhoPagina = tamanhoPagina,
            TotalRegistros = total,
        };
    }

    public async Task<ClienteDto?> ObterPorIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Clientes
            .Where(c => c.Cdcliente == id)
            .Select(c => new ClienteDto
            {
                Id = c.Cdcliente,
                Nome = c.Nome,
                Cpf = c.Cpf,
                Rg = c.Rg,
                Ddd = c.Dddtelefone,
                Telefone = c.Telefone,
                DddCelular = c.Dddcelular,
                Celular = c.Celular,
                Email = c.Email,
                Cep = c.Cep,
                Logradouro = c.Logradouro,
                Numero = c.Nrlogradouro,
                Complemento = c.Complemento,
                Cidade = c.Cidade,
                Uf = c.Uf,
                DataNascimento = c.Dtnascimento,
                Profissao = c.Profissao,
                ClasseSocial = c.ClasseSocial,
                Sexo = c.Tpsexo,
                Observacao = c.Observacao,
                DataCadastro = c.DataCadastro,
                QuantidadeFilhos = c.Filhos.Count,
                QuantidadeLocacoes = c.Locacoes.Count,
                Filhos = c.Filhos.Select(f => new FilhoDto
                {
                    Id = f.Cdfilho,
                    Nome = f.Nome,
                    DataNascimento = f.Dtnascimento,
                    Sexo = f.Tpsexo,
                }).ToList(),
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<ClienteDto> CriarAsync(ClienteUpsertRequest request, CancellationToken ct = default)
    {
        await ValidarCpfUnicoAsync(request.Cpf, idAtual: null, ct);

        var entidade = new Cliente
        {
            Nome = request.Nome,
            Cpf = request.Cpf,
            Rg = request.Rg,
            Dddtelefone = request.Ddd,
            Telefone = request.Telefone,
            Dddcelular = request.DddCelular,
            Celular = request.Celular,
            Email = request.Email,
            Cep = request.Cep,
            Logradouro = request.Logradouro,
            Nrlogradouro = request.Numero,
            Complemento = request.Complemento,
            Cidade = request.Cidade,
            Uf = request.Uf,
            Dtnascimento = request.DataNascimento,
            Profissao = request.Profissao,
            ClasseSocial = request.ClasseSocial,
            Tpsexo = request.Sexo,
            Observacao = request.Observacao,
            DataCadastro = DateTime.Now,
        };

        foreach (var filho in request.Filhos)
        {
            entidade.Filhos.Add(new Filho
            {
                Nome = filho.Nome,
                Dtnascimento = filho.DataNascimento,
                Tpsexo = filho.Sexo,
            });
        }

        _db.Clientes.Add(entidade);
        await _db.SaveChangesAsync(ct);

        return await ObterPorIdAsync(entidade.Cdcliente, ct)
            ?? throw new InvalidOperationException("Falha ao recarregar cliente recém-criado.");
    }

    public async Task<ClienteDto> AtualizarAsync(int id, ClienteUpsertRequest request, CancellationToken ct = default)
    {
        var entidade = await _db.Clientes.Include(c => c.Filhos).FirstOrDefaultAsync(c => c.Cdcliente == id, ct)
            ?? throw new KeyNotFoundException($"Cliente {id} não encontrado.");

        await ValidarCpfUnicoAsync(request.Cpf, idAtual: id, ct);

        entidade.Nome = request.Nome;
        entidade.Cpf = request.Cpf;
        entidade.Rg = request.Rg;
        entidade.Dddtelefone = request.Ddd;
        entidade.Telefone = request.Telefone;
        entidade.Dddcelular = request.DddCelular;
        entidade.Celular = request.Celular;
        entidade.Email = request.Email;
        entidade.Cep = request.Cep;
        entidade.Logradouro = request.Logradouro;
        entidade.Nrlogradouro = request.Numero;
        entidade.Complemento = request.Complemento;
        entidade.Cidade = request.Cidade;
        entidade.Uf = request.Uf;
        entidade.Dtnascimento = request.DataNascimento;
        entidade.Profissao = request.Profissao;
        entidade.ClasseSocial = request.ClasseSocial;
        entidade.Tpsexo = request.Sexo;
        entidade.Observacao = request.Observacao;
        entidade.DataAlteracao = DateTime.Now;

        SincronizarFilhos(entidade, request.Filhos);

        await _db.SaveChangesAsync(ct);

        return await ObterPorIdAsync(id, ct)
            ?? throw new InvalidOperationException("Falha ao recarregar cliente atualizado.");
    }

    /// <summary>
    /// Cliente não tem coluna de "ativo" no schema legado, então a exclusão é física.
    /// Bloqueada quando há locações (histórico), para não perder rastreabilidade financeira.
    /// </summary>
    public async Task ExcluirAsync(int id, CancellationToken ct = default)
    {
        var cliente = await _db.Clientes.Include(c => c.Filhos).FirstOrDefaultAsync(c => c.Cdcliente == id, ct)
            ?? throw new KeyNotFoundException($"Cliente {id} não encontrado.");

        var possuiLocacoes = await _db.Locacoes.AnyAsync(l => l.Cdcliente == id, ct);
        if (possuiLocacoes)
            throw new InvalidOperationException("Não é possível excluir um cliente com locações registradas.");

        if (cliente.Filhos.Count > 0)
            _db.Filhos.RemoveRange(cliente.Filhos);

        _db.Clientes.Remove(cliente);
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Reconcilia a coleção de Filhos do cliente com o que veio do formulário: remove os que
    /// saíram da lista, atualiza os existentes (por Id) e cria os novos (Id nulo).
    /// </summary>
    private static void SincronizarFilhos(Cliente cliente, List<FilhoUpsertRequest> filhosRequest)
    {
        var idsRecebidos = filhosRequest.Where(f => f.Id.HasValue).Select(f => f.Id!.Value).ToHashSet();

        var removidos = cliente.Filhos.Where(f => !idsRecebidos.Contains(f.Cdfilho)).ToList();
        foreach (var removido in removidos)
            cliente.Filhos.Remove(removido);

        foreach (var filhoRequest in filhosRequest)
        {
            if (filhoRequest.Id.HasValue)
            {
                var existente = cliente.Filhos.FirstOrDefault(f => f.Cdfilho == filhoRequest.Id.Value);
                if (existente is not null)
                {
                    existente.Nome = filhoRequest.Nome;
                    existente.Dtnascimento = filhoRequest.DataNascimento;
                    existente.Tpsexo = filhoRequest.Sexo;
                    continue;
                }
            }

            cliente.Filhos.Add(new Filho
            {
                Nome = filhoRequest.Nome,
                Dtnascimento = filhoRequest.DataNascimento,
                Tpsexo = filhoRequest.Sexo,
            });
        }
    }

    private async Task ValidarCpfUnicoAsync(string cpf, int? idAtual, CancellationToken ct)
    {
        var emUso = await _db.Clientes.AnyAsync(c => c.Cpf == cpf && c.Cdcliente != (idAtual ?? 0), ct);
        if (emUso)
            throw new InvalidOperationException("Já existe um cliente cadastrado com esse CPF.");
    }
}
