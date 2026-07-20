using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Empresa;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Empresas;

public class EmpresaService : IEmpresaService
{
    private readonly AppDbContext _db;

    public EmpresaService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<EmpresaDto?> ObterAsync(CancellationToken ct = default)
    {
        return await _db.Empresas
            .OrderBy(e => e.Cdempresa)
            .Select(e => new EmpresaDto
            {
                Id = e.Cdempresa,
                Cnpj = e.Cnpj,
                RazaoSocial = e.RazaoSocial,
                ResponsavelLegal = e.ResponsavelLegal,
                Cep = e.Cep,
                Logradouro = e.Logradouro,
                Complemento = e.Complemento,
                Numero = e.Nrlogradouro,
                Ddd = e.Ddd,
                Telefone = e.Telefone,
                Celular = e.Celular,
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<EmpresaDto> SalvarAsync(EmpresaUpsertRequest request, CancellationToken ct = default)
    {
        var entidade = await _db.Empresas.OrderBy(e => e.Cdempresa).FirstOrDefaultAsync(ct);

        if (entidade is null)
        {
            entidade = new Empresa();
            _db.Empresas.Add(entidade);
        }

        entidade.Cnpj = request.Cnpj;
        entidade.RazaoSocial = request.RazaoSocial;
        entidade.ResponsavelLegal = request.ResponsavelLegal;
        entidade.Cep = request.Cep;
        entidade.Logradouro = request.Logradouro;
        entidade.Complemento = request.Complemento;
        entidade.Nrlogradouro = request.Numero;
        entidade.Ddd = request.Ddd;
        entidade.Telefone = request.Telefone;
        entidade.Celular = request.Celular;

        await _db.SaveChangesAsync(ct);

        return await ObterAsync(ct)
            ?? throw new InvalidOperationException("Falha ao recarregar dados da empresa.");
    }
}
