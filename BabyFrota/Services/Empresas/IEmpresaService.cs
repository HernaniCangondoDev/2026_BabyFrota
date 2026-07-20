using BabyFrota.DTOs.Empresa;

namespace BabyFrota.Services.Empresas;

/// <summary>
/// A tabela Empresa é singleton na prática (o sistema legado nunca ofereceu um seletor de
/// multiempresa) — sempre lemos/gravamos o primeiro (e único) registro.
/// </summary>
public interface IEmpresaService
{
    Task<EmpresaDto?> ObterAsync(CancellationToken ct = default);
    Task<EmpresaDto> SalvarAsync(EmpresaUpsertRequest request, CancellationToken ct = default);
}
