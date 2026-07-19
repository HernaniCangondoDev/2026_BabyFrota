using BabyFrota.DTOs.Dashboard;
using BabyFrota.Services.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyFrota.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    /// <summary>KPIs exibidos na home (dashboard BI) do novo sistema.</summary>
    [HttpGet("resumo")]
    public async Task<ActionResult<DashboardResumoDto>> Resumo(CancellationToken ct)
        => Ok(await _service.ObterResumoAsync(ct));
}
