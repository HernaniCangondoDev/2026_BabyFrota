namespace BabyFrota.DTOs.Common;

/// <summary>Envelope padrão para listagens paginadas server-side (evita "SELECT *" em tabelas grandes).</summary>
public class PagedResult<T>
{
    public List<T> Itens { get; set; } = new();
    public int Pagina { get; set; }
    public int TamanhoPagina { get; set; }
    public int TotalRegistros { get; set; }
    public int TotalPaginas => TamanhoPagina <= 0 ? 0 : (int)Math.Ceiling(TotalRegistros / (double)TamanhoPagina);
}
