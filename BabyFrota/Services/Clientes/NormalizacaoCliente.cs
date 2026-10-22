using System.Globalization;
using BabyFrota.DTOs.Clientes;

namespace BabyFrota.Services.Clientes;

/// <summary>
/// Prepara o cadastro do cliente para caber no banco do legado antes de gravar. O banco guarda CPF, CEP, DDD, telefone e
/// celular só com números (como o legado, que tirava a máscara), em colunas curtas (CPF 11, CEP 8, telefone 9, DDD 2).
/// Gravar "72915-000" ou "529.982.247-25" como veio da tela estourava a coluna e devolvia erro 500 ("String or binary data
/// would be truncated"). Aqui a máscara sai e, se mesmo assim um campo não couber, a resposta é uma mensagem clara (400).
/// </summary>
/// <remarks>
/// Só garante que cabe na coluna; não exige formato exato (CPF com 11 dígitos, telefone com 8 ou 9): o legado deixou
/// clientes com telefone vazio e CPF fora do padrão, e eles precisam continuar podendo ser editados.
/// </remarks>
internal static class NormalizacaoCliente
{
    public static void Aplicar(ClienteUpsertRequest r)
    {
        r.Nome = Texto(r.Nome, "Nome", 100) ?? string.Empty;
        if (r.Nome.Length == 0)
            throw new ArgumentException("Informe o nome do cliente.");

        r.Cpf = Digitos(r.Cpf, "CPF", 11) ?? string.Empty;
        if (r.Cpf.Length == 0)
            throw new ArgumentException("Informe o CPF do cliente.");

        r.Rg = Texto(r.Rg, "RG", 30);
        // DDD e telefone são obrigatórios na tabela (NOT NULL): vazio fica "" como no legado, e não nulo.
        r.Ddd = Digitos(r.Ddd, "DDD do telefone", 2) ?? string.Empty;
        r.Telefone = Digitos(r.Telefone, "Telefone", 9) ?? string.Empty;
        r.DddCelular = Digitos(r.DddCelular, "DDD do celular", 2);
        r.Celular = Digitos(r.Celular, "Celular", 9);
        r.Email = Texto(r.Email, "E-mail", 50) is { Length: > 0 } email ? email : null;
        r.Cep = Digitos(r.Cep, "CEP", 8);
        r.Logradouro = Texto(r.Logradouro, "Logradouro", 200);
        r.Numero = Texto(r.Numero, "Número", 10);
        r.Complemento = Texto(r.Complemento, "Complemento", 100);
        r.Cidade = Texto(r.Cidade, "Cidade", 100);
        r.Uf = Texto(r.Uf, "UF", 2)?.ToUpper(CultureInfo.InvariantCulture);
        r.Profissao = Texto(r.Profissao, "Profissão", 100);
        r.ClasseSocial = Texto(r.ClasseSocial, "Classe social", 100);
        r.Sexo = Texto(r.Sexo, "Sexo", 1)?.ToUpper(CultureInfo.InvariantCulture);
        r.Observacao = Texto(r.Observacao, "Observação", 1000);

        foreach (var filho in r.Filhos)
        {
            filho.Nome = Texto(filho.Nome, "Nome do filho", 100) ?? string.Empty;
            if (filho.Nome.Length == 0)
                throw new ArgumentException("Informe o nome de cada filho.");
            filho.Sexo = Texto(filho.Sexo, "Sexo do filho", 1)?.ToUpper(CultureInfo.InvariantCulture);
        }
    }

    /// <summary>Sem espaços nas pontas; nulo continua nulo.</summary>
    private static string? Texto(string? valor, string campo, int maximo)
    {
        if (valor is null)
            return null;
        var limpo = valor.Trim();
        if (limpo.Length > maximo)
            throw new ArgumentException($"{campo}: no máximo {maximo} caracteres (veio com {limpo.Length}).");
        return limpo;
    }

    /// <summary>Só os números ("72915-000" vira "72915000"); nulo continua nulo.</summary>
    private static string? Digitos(string? valor, string campo, int maximo)
    {
        if (valor is null)
            return null;
        var digitos = new string(valor.Where(char.IsAsciiDigit).ToArray());
        if (digitos.Length > maximo)
            throw new ArgumentException($"{campo}: no máximo {maximo} dígitos (veio com {digitos.Length}).");
        return digitos;
    }
}
