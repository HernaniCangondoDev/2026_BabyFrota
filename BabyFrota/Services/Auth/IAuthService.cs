using BabyFrota.DTOs.Auth;

namespace BabyFrota.Services.Auth;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, string enderecoIp, CancellationToken ct = default);
}
