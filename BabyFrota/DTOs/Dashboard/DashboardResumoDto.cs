namespace BabyFrota.DTOs.Dashboard;

/// <summary>
/// KPIs consumidos pela home (dashboard BI) do novo sistema. Primeira fatia — novos indicadores
/// serão agregados aqui conforme os demais módulos (locação/caixa) forem migrados.
/// </summary>
public class DashboardResumoDto
{
    public int TotalCarrinhos { get; set; }
    public int CarrinhosDisponiveis { get; set; }
    public int CarrinhosAlugados { get; set; }
    public double PercentualOcupacao { get; set; }

    public bool CaixaAberto { get; set; }
    public decimal? FaturamentoCaixaAtual { get; set; }

    public decimal FaturamentoHoje { get; set; }
    public int LocacoesHoje { get; set; }
    public decimal TicketMedioHoje { get; set; }

    public List<CarrinhoMaisLocadoDto> TopCarrinhos { get; set; } = new();
}

public class CarrinhoMaisLocadoDto
{
    public string Descricao { get; set; } = string.Empty;
    public int QuantidadeLocacoes { get; set; }
}
