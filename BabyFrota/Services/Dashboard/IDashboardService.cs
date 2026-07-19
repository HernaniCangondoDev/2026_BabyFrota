using BabyFrota.DTOs.Dashboard;

namespace BabyFrota.Services.Dashboard;

public interface IDashboardService
{
    Task<DashboardResumoDto> ObterResumoAsync(CancellationToken ct = default);
}
