using System;
using System.Collections.Generic;
using BabyFrota.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Bairro> Bairros { get; set; }

    public virtual DbSet<CaixaMovimento> CaixaMovimentos { get; set; }

    public virtual DbSet<Carrinho> Carrinhos { get; set; }

    public virtual DbSet<Cep> Ceps { get; set; }

    public virtual DbSet<Cliente> Clientes { get; set; }

    public virtual DbSet<Empresa> Empresas { get; set; }

    public virtual DbSet<Filho> Filhos { get; set; }

    public virtual DbSet<FormaRecebimento> FormaRecebimentos { get; set; }

    public virtual DbSet<Locacao> Locacaos { get; set; }

    public virtual DbSet<Localidade> Localidades { get; set; }

    public virtual DbSet<Parcela> Parcelas { get; set; }

    public virtual DbSet<Perfil> Perfils { get; set; }

    public virtual DbSet<PrecoLocacao> PrecoLocacaos { get; set; }

    public virtual DbSet<Sangrium> Sangria { get; set; }

    public virtual DbSet<Status> Statuses { get; set; }

    public virtual DbSet<Suprimento> Suprimentos { get; set; }

    public virtual DbSet<Tblog> Tblogs { get; set; }

    public virtual DbSet<TipoCarrinho> TipoCarrinhos { get; set; }

    public virtual DbSet<Troca> Trocas { get; set; }

    public virtual DbSet<Uf> Ufs { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<Vlocacao> Vlocacaos { get; set; }

    public virtual DbSet<Vtroca> Vtrocas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Bairro>(entity =>
        {
            entity.HasKey(e => e.Cdbairro);

            entity.ToTable("Bairro");

            entity.Property(e => e.Cdbairro)
                .ValueGeneratedNever()
                .HasColumnName("CDBairro");
            entity.Property(e => e.Bairro1)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("Bairro");
            entity.Property(e => e.Cdlocalidade).HasColumnName("CDLocalidade");
            entity.Property(e => e.Chvbai)
                .HasMaxLength(8)
                .IsUnicode(false)
                .HasColumnName("CHVBAI");

            entity.HasOne(d => d.CdlocalidadeNavigation).WithMany(p => p.Bairros)
                .HasForeignKey(d => d.Cdlocalidade)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Bairro_Localidade");
        });

        modelBuilder.Entity<CaixaMovimento>(entity =>
        {
            entity.HasKey(e => e.CdcaixaMovimento);

            entity.ToTable("CaixaMovimento");

            entity.Property(e => e.CdcaixaMovimento).HasColumnName("CDCaixaMovimento");
            entity.Property(e => e.CdusuarioAbertura).HasColumnName("CDUsuarioAbertura");
            entity.Property(e => e.CdusuarioFechamento).HasColumnName("CDUsuarioFechamento");
            entity.Property(e => e.Dtabertura)
                .HasColumnType("datetime")
                .HasColumnName("DTAbertura");
            entity.Property(e => e.Dtfechamento)
                .HasColumnType("datetime")
                .HasColumnName("DTFechamento");
            entity.Property(e => e.SuprimentoInicial).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.ValorFechamento).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CdusuarioAberturaNavigation).WithMany(p => p.CaixaMovimentoCdusuarioAberturaNavigations)
                .HasForeignKey(d => d.CdusuarioAbertura)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CaixaMovimento_UsuarioAbertura");

            entity.HasOne(d => d.CdusuarioFechamentoNavigation).WithMany(p => p.CaixaMovimentoCdusuarioFechamentoNavigations)
                .HasForeignKey(d => d.CdusuarioFechamento)
                .HasConstraintName("FK_CaixaMovimento_UsuarioFechamento");
        });

        modelBuilder.Entity<Carrinho>(entity =>
        {
            entity.HasKey(e => e.Cdcarrinho);

            entity.ToTable("Carrinho");

            entity.HasIndex(e => e.CdtipoCarrinho, "IX_Carrinho_CDTipoCarrinho");

            entity.Property(e => e.Cdcarrinho).HasColumnName("CDCarrinho");
            entity.Property(e => e.Cdstatus).HasColumnName("CDStatus");
            entity.Property(e => e.CdtipoCarrinho).HasColumnName("CDTipoCarrinho");
            entity.Property(e => e.CdusuarioAlteracao).HasColumnName("CDUsuarioAlteracao");
            entity.Property(e => e.CdusuarioCadastro).HasColumnName("CDUsuarioCadastro");
            entity.Property(e => e.DataAlteracao).HasColumnType("datetime");
            entity.Property(e => e.DataCadastro).HasColumnType("datetime");
            entity.Property(e => e.Descricao)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.DocumentoCompra).HasColumnType("image");
            entity.Property(e => e.Dtaquisicao).HasColumnName("DTAquisicao");
            entity.Property(e => e.Fornecedor)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Foto).HasColumnType("image");
            entity.Property(e => e.MimeDocumentoCompra)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.MimeFoto)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Observacao)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.ValorAquisicao).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CdstatusNavigation).WithMany(p => p.Carrinhos)
                .HasForeignKey(d => d.Cdstatus)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Carrinho_Status");

            entity.HasOne(d => d.CdtipoCarrinhoNavigation).WithMany(p => p.Carrinhos)
                .HasForeignKey(d => d.CdtipoCarrinho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Carrinho_TipoCarrinho");
        });

        modelBuilder.Entity<Cep>(entity =>
        {
            entity.HasKey(e => e.Cep1);

            entity.ToTable("CEP");

            entity.Property(e => e.Cep1)
                .ValueGeneratedNever()
                .HasColumnName("CEP");
            entity.Property(e => e.Cdbairro).HasColumnName("CDBairro");
            entity.Property(e => e.Logradouro)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Statualizado).HasColumnName("STAtualizado");
            entity.Property(e => e.Stbloqueado).HasColumnName("STBloqueado");

            entity.HasOne(d => d.CdbairroNavigation).WithMany(p => p.Ceps)
                .HasForeignKey(d => d.Cdbairro)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CEP_Bairro");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.Cdcliente);

            entity.ToTable("Cliente");

            entity.HasIndex(e => e.Cdcliente, "IDX_ClienteFilhos_CDCliente");

            entity.Property(e => e.Cdcliente).HasColumnName("CDCliente");
            entity.Property(e => e.CdusuarioAlteracao).HasColumnName("CDUsuarioAlteracao");
            entity.Property(e => e.CdusuarioCadastro).HasColumnName("CDUsuarioCadastro");
            entity.Property(e => e.Celular)
                .HasMaxLength(9)
                .IsUnicode(false);
            entity.Property(e => e.Cep)
                .HasMaxLength(8)
                .IsUnicode(false)
                .HasColumnName("CEP");
            entity.Property(e => e.Cidade)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.ClasseSocial)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Complemento)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Cpf)
                .HasMaxLength(11)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("CPF");
            entity.Property(e => e.DataAlteracao).HasColumnType("datetime");
            entity.Property(e => e.DataCadastro).HasColumnType("datetime");
            entity.Property(e => e.Dddcelular)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("DDDCelular");
            entity.Property(e => e.Dddtelefone)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("DDDTelefone");
            entity.Property(e => e.Documento).HasColumnType("image");
            entity.Property(e => e.Dtnascimento).HasColumnName("DTNascimento");
            entity.Property(e => e.Email)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Foto).HasColumnType("image");
            entity.Property(e => e.Logradouro)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.MimeDocumento)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.MimeFoto)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Nome)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Nrlogradouro)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("NRLogradouro");
            entity.Property(e => e.Observacao)
                .HasMaxLength(1000)
                .IsUnicode(false);
            entity.Property(e => e.Profissao)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Rg)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("RG");
            entity.Property(e => e.Telefone)
                .HasMaxLength(9)
                .IsUnicode(false);
            entity.Property(e => e.Tpsexo)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("TPSexo");
            entity.Property(e => e.Uf)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("UF");
        });

        modelBuilder.Entity<Empresa>(entity =>
        {
            entity.HasKey(e => e.Cdempresa);

            entity.ToTable("Empresa");

            entity.Property(e => e.Cdempresa)
                .ValueGeneratedNever()
                .HasColumnName("CDEmpresa");
            entity.Property(e => e.Celular)
                .HasMaxLength(8)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Cep)
                .HasMaxLength(8)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("CEP");
            entity.Property(e => e.Cnpj)
                .HasMaxLength(14)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("CNPJ");
            entity.Property(e => e.Complemento)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.Ddd)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("DDD");
            entity.Property(e => e.Logomarca).HasColumnType("image");
            entity.Property(e => e.Logradouro)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.MimeLogomarca)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Nrlogradouro)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("NRLogradouro");
            entity.Property(e => e.RazaoSocial)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.ResponsavelLegal)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.Telefone)
                .HasMaxLength(8)
                .IsUnicode(false)
                .IsFixedLength();
        });

        modelBuilder.Entity<Filho>(entity =>
        {
            entity.HasKey(e => e.Cdfilho);

            entity.ToTable("Filho");

            entity.HasIndex(e => e.Cdcliente, "IX_Filho_CDCliente");

            entity.Property(e => e.Cdfilho).HasColumnName("CDFilho");
            entity.Property(e => e.Cdcliente).HasColumnName("CDCliente");
            entity.Property(e => e.Dtnascimento).HasColumnName("DTNascimento");
            entity.Property(e => e.Nome)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Tpsexo)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("TPSexo");

            entity.HasOne(d => d.CdclienteNavigation).WithMany(p => p.Filhos)
                .HasForeignKey(d => d.Cdcliente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Filho_Cliente");
        });

        modelBuilder.Entity<FormaRecebimento>(entity =>
        {
            entity.HasKey(e => e.CdformaRecebimento);

            entity.ToTable("FormaRecebimento");

            entity.Property(e => e.CdformaRecebimento)
                .ValueGeneratedNever()
                .HasColumnName("CDFormaRecebimento");
            entity.Property(e => e.Nome)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Locacao>(entity =>
        {
            entity.HasKey(e => e.Cdlocacao);

            entity.ToTable("Locacao");

            entity.HasIndex(e => e.Dtentrega, "IDX_Locacao_DTEntrega");

            entity.HasIndex(e => e.Cdcliente, "IX_Locacao_CDCliente");

            entity.HasIndex(e => e.Dtentrega, "IX_Locacao_DTEntrega");

            entity.Property(e => e.Cdlocacao).HasColumnName("CDLocacao");
            entity.Property(e => e.CdcaixaMovimento).HasColumnName("CDCaixaMovimento");
            entity.Property(e => e.Cdcarrinho).HasColumnName("CDCarrinho");
            entity.Property(e => e.Cdcliente).HasColumnName("CDCliente");
            entity.Property(e => e.CdusuarioDevolucao).HasColumnName("CDUsuarioDevolucao");
            entity.Property(e => e.CdusuarioEntrega).HasColumnName("CDUsuarioEntrega");
            entity.Property(e => e.Desconto).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Dtdevolucao)
                .HasColumnType("datetime")
                .HasColumnName("DTDevolucao");
            entity.Property(e => e.Dtentrega)
                .HasColumnType("datetime")
                .HasColumnName("DTEntrega");
            entity.Property(e => e.Observacao)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Troco).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.ValorTotal).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CdcaixaMovimentoNavigation).WithMany(p => p.Locacaos)
                .HasForeignKey(d => d.CdcaixaMovimento)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Locacao_CaixaMovimento");

            entity.HasOne(d => d.CdcarrinhoNavigation).WithMany(p => p.Locacaos)
                .HasForeignKey(d => d.Cdcarrinho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Locacao_Carrinho");

            entity.HasOne(d => d.CdclienteNavigation).WithMany(p => p.Locacaos)
                .HasForeignKey(d => d.Cdcliente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Locacao_Cliente");

            entity.HasOne(d => d.CdusuarioDevolucaoNavigation).WithMany(p => p.LocacaoCdusuarioDevolucaoNavigations)
                .HasForeignKey(d => d.CdusuarioDevolucao)
                .HasConstraintName("FK_Locacao_UsuarioDevolucao");

            entity.HasOne(d => d.CdusuarioEntregaNavigation).WithMany(p => p.LocacaoCdusuarioEntregaNavigations)
                .HasForeignKey(d => d.CdusuarioEntrega)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Locacao_UsuarioEntrega");
        });

        modelBuilder.Entity<Localidade>(entity =>
        {
            entity.HasKey(e => e.Cdlocalidade);

            entity.ToTable("Localidade");

            entity.Property(e => e.Cdlocalidade)
                .ValueGeneratedNever()
                .HasColumnName("CDLocalidade");
            entity.Property(e => e.CdmunicipioIbge)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("CDMunicipioIBGE");
            entity.Property(e => e.Cduf).HasColumnName("CDUF");
            entity.Property(e => e.Chaveloc)
                .HasMaxLength(5)
                .IsUnicode(false)
                .HasColumnName("CHAVELOC");
            entity.Property(e => e.Ddd).HasColumnName("DDD");
            entity.Property(e => e.Localidade1)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("Localidade");

            entity.HasOne(d => d.CdufNavigation).WithMany(p => p.Localidades)
                .HasForeignKey(d => d.Cduf)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Localidade_UF");
        });

        modelBuilder.Entity<Parcela>(entity =>
        {
            entity.HasKey(e => new { e.Cdlocacao, e.Nrparcela }).HasName("PK__Parcela__1184696681C2EE26");

            entity.ToTable("Parcela");

            entity.HasIndex(e => e.Cdlocacao, "IDX_Parcela_CDLocacao");

            entity.HasIndex(e => e.Cdlocacao, "IX_Parcela_CDLocacao");

            entity.Property(e => e.Cdlocacao).HasColumnName("CDLocacao");
            entity.Property(e => e.Nrparcela).HasColumnName("NRParcela");
            entity.Property(e => e.CdformaRecebimento).HasColumnName("CDFormaRecebimento");
            entity.Property(e => e.ValorRecebido).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CdformaRecebimentoNavigation).WithMany(p => p.Parcelas)
                .HasForeignKey(d => d.CdformaRecebimento)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Parcela_FormaRecebimento");

            entity.HasOne(d => d.CdlocacaoNavigation).WithMany(p => p.Parcelas)
                .HasForeignKey(d => d.Cdlocacao)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Parcela_Locacao");
        });

        modelBuilder.Entity<Perfil>(entity =>
        {
            entity.HasKey(e => e.Cdperfil);

            entity.ToTable("Perfil");

            entity.Property(e => e.Cdperfil)
                .ValueGeneratedNever()
                .HasColumnName("CDPerfil");
            entity.Property(e => e.Nome)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<PrecoLocacao>(entity =>
        {
            entity.HasKey(e => e.CdprecoLocacao);

            entity.ToTable("PrecoLocacao");

            entity.Property(e => e.CdprecoLocacao).HasColumnName("CDPrecoLocacao");
            entity.Property(e => e.CdtipoCarrinho).HasColumnName("CDTipoCarrinho");
            entity.Property(e => e.Valor).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CdtipoCarrinhoNavigation).WithMany(p => p.PrecoLocacaos)
                .HasForeignKey(d => d.CdtipoCarrinho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PrecoLocacao_TipoCarrinho");
        });

        modelBuilder.Entity<Sangrium>(entity =>
        {
            entity.HasKey(e => e.Cdsangria);

            entity.Property(e => e.Cdsangria).HasColumnName("CDSangria");
            entity.Property(e => e.CdcaixaMovimento).HasColumnName("CDCaixaMovimento");
            entity.Property(e => e.Cdusuario).HasColumnName("CDUsuario");
            entity.Property(e => e.Dtsangria)
                .HasColumnType("datetime")
                .HasColumnName("DTSangria");
            entity.Property(e => e.Valor).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CdcaixaMovimentoNavigation).WithMany(p => p.Sangria)
                .HasForeignKey(d => d.CdcaixaMovimento)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Sangria_CaixaMovimento");

            entity.HasOne(d => d.CdusuarioNavigation).WithMany(p => p.Sangria)
                .HasForeignKey(d => d.Cdusuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Sangria_Usuario");
        });

        modelBuilder.Entity<Status>(entity =>
        {
            entity.HasKey(e => e.Cdstatus);

            entity.ToTable("Status");

            entity.Property(e => e.Cdstatus)
                .ValueGeneratedNever()
                .HasColumnName("CDStatus");
            entity.Property(e => e.Nome)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Suprimento>(entity =>
        {
            entity.HasKey(e => e.Cdsuprimento);

            entity.ToTable("Suprimento");

            entity.Property(e => e.Cdsuprimento).HasColumnName("CDSuprimento");
            entity.Property(e => e.CdcaixaMovimento).HasColumnName("CDCaixaMovimento");
            entity.Property(e => e.Cdusuario).HasColumnName("CDUsuario");
            entity.Property(e => e.Dtsuprimento)
                .HasColumnType("datetime")
                .HasColumnName("DTSuprimento");
            entity.Property(e => e.Valor).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CdcaixaMovimentoNavigation).WithMany(p => p.Suprimentos)
                .HasForeignKey(d => d.CdcaixaMovimento)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Suprimento_Suprimento");

            entity.HasOne(d => d.CdusuarioNavigation).WithMany(p => p.Suprimentos)
                .HasForeignKey(d => d.Cdusuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Suprimento_Usuario");
        });

        modelBuilder.Entity<Tblog>(entity =>
        {
            entity.HasKey(e => e.Cdlog).HasName("PK__TBLog__2480E780251C81ED");

            entity.ToTable("TBLog");

            entity.Property(e => e.Cdlog).HasColumnName("CDLog");
            entity.Property(e => e.Acao)
                .HasMaxLength(12)
                .IsUnicode(false);
            entity.Property(e => e.Cdusuario).HasColumnName("CDUsuario");
            entity.Property(e => e.ColunasModificadas).IsUnicode(false);
            entity.Property(e => e.Data).HasColumnType("datetime");
            entity.Property(e => e.Ip)
                .HasMaxLength(16)
                .IsUnicode(false)
                .HasColumnName("IP");
            entity.Property(e => e.Tabela)
                .HasMaxLength(300)
                .IsUnicode(false);
            entity.Property(e => e.ValorAntigo).IsUnicode(false);
            entity.Property(e => e.ValorNovo).IsUnicode(false);

            entity.HasOne(d => d.CdusuarioNavigation).WithMany(p => p.Tblogs)
                .HasForeignKey(d => d.Cdusuario)
                .HasConstraintName("FK__TBLog__CDUsuario__2704CA5F");
        });

        modelBuilder.Entity<TipoCarrinho>(entity =>
        {
            entity.HasKey(e => e.CdtipoCarrinho);

            entity.ToTable("TipoCarrinho");

            entity.Property(e => e.CdtipoCarrinho).HasColumnName("CDTipoCarrinho");
            entity.Property(e => e.Descricao)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Troca>(entity =>
        {
            entity.HasKey(e => e.Cdtroca);

            entity.ToTable("Troca");

            entity.Property(e => e.Cdtroca).HasColumnName("CDTroca");
            entity.Property(e => e.CdcarrinhoAnterior).HasColumnName("CDCarrinhoAnterior");
            entity.Property(e => e.Cdlocacao).HasColumnName("CDLocacao");
            entity.Property(e => e.CdnovoCarrinho).HasColumnName("CDNovoCarrinho");
            entity.Property(e => e.CdusuarioTroca).HasColumnName("CDUsuarioTroca");
            entity.Property(e => e.Dttroca)
                .HasColumnType("datetime")
                .HasColumnName("DTTroca");
            entity.Property(e => e.PrecoCarrinhoAnterior).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CdcarrinhoAnteriorNavigation).WithMany(p => p.TrocaCdcarrinhoAnteriorNavigations)
                .HasForeignKey(d => d.CdcarrinhoAnterior)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Troca_Carrinho");

            entity.HasOne(d => d.CdlocacaoNavigation).WithMany(p => p.Trocas)
                .HasForeignKey(d => d.Cdlocacao)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Troca_Locacao");

            entity.HasOne(d => d.CdnovoCarrinhoNavigation).WithMany(p => p.TrocaCdnovoCarrinhoNavigations)
                .HasForeignKey(d => d.CdnovoCarrinho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Troca_Carrinho1");
        });

        modelBuilder.Entity<Uf>(entity =>
        {
            entity.HasKey(e => e.Cduf);

            entity.ToTable("UF");

            entity.Property(e => e.Cduf)
                .ValueGeneratedNever()
                .HasColumnName("CDUF");
            entity.Property(e => e.Descricao)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.NrcodPais)
                .HasMaxLength(5)
                .IsUnicode(false)
                .HasColumnName("NRCodPais");
            entity.Property(e => e.NrmunicipioIbge)
                .HasMaxLength(7)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("NRMunicipioIBGE");
            entity.Property(e => e.Nrufibge)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("NRUFIBGE");
            entity.Property(e => e.Pais)
                .HasMaxLength(20)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Regiao)
                .HasMaxLength(20)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.StfreteGratuito).HasColumnName("STFreteGratuito");
            entity.Property(e => e.Uf1)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("UF");
            entity.Property(e => e.VlminVendaFreteGratuito)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("VLMinVendaFreteGratuito");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Cdusuario);

            entity.ToTable("Usuario");

            entity.Property(e => e.Cdusuario).HasColumnName("CDUsuario");
            entity.Property(e => e.Cdperfil).HasColumnName("CDPerfil");
            entity.Property(e => e.CdusuarioAlteracao).HasColumnName("CDUsuarioAlteracao");
            entity.Property(e => e.CdusuarioCadastro).HasColumnName("CDUsuarioCadastro");
            entity.Property(e => e.Celular)
                .HasMaxLength(9)
                .IsUnicode(false);
            entity.Property(e => e.Cep)
                .HasMaxLength(8)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("CEP");
            entity.Property(e => e.Cidade)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Complemento)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.Cpf)
                .HasMaxLength(11)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("CPF");
            entity.Property(e => e.DataAlteracao).HasColumnType("datetime");
            entity.Property(e => e.DataCadastro).HasColumnType("datetime");
            entity.Property(e => e.Ddd)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("DDD");
            entity.Property(e => e.Dddcelular)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("DDDCelular");
            entity.Property(e => e.Documento).HasColumnType("image");
            entity.Property(e => e.Dtadmissao).HasColumnName("DTAdmissao");
            entity.Property(e => e.Dtnascimento).HasColumnName("DTNascimento");
            entity.Property(e => e.Email)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Foto).HasColumnType("image");
            entity.Property(e => e.Logradouro)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.MimeDocumento)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.MimeFoto)
                .HasMaxLength(3)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Nome)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.NrcarteiraTrabalho)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("NRCarteiraTrabalho");
            entity.Property(e => e.Nrlogradouro)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("NRLogradouro");
            entity.Property(e => e.Observacao)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Referencias)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Rg)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("RG");
            entity.Property(e => e.Senha)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Stativo).HasColumnName("STAtivo");
            entity.Property(e => e.Telefone)
                .HasMaxLength(9)
                .IsUnicode(false);
            entity.Property(e => e.Uf)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("UF");

            entity.HasOne(d => d.CdperfilNavigation).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.Cdperfil)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Usuario_Perfil");
        });

        modelBuilder.Entity<Vlocacao>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("VLocacao");

            entity.Property(e => e.Carrinho)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Cliente)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Desconto).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Dtdevolucao)
                .HasColumnType("datetime")
                .HasColumnName("DTDevolucao");
            entity.Property(e => e.Dtentrega)
                .HasColumnType("datetime")
                .HasColumnName("DTEntrega");
            entity.Property(e => e.FormaRecebimento)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Observacao)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.TipoCarrinho)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.UsuarioDevolucao)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.UsuarioEntrega)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Valor).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.ValorRecebido).HasColumnType("decimal(12, 2)");
        });

        modelBuilder.Entity<Vtroca>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("VTroca");

            entity.Property(e => e.Cliente).HasColumnName("CLiente");
            entity.Property(e => e.DescricaoCarrinhoAnterior)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.DescricaoNovoCarrinho)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.DthoraLocacao)
                .HasColumnType("datetime")
                .HasColumnName("DTHoraLocacao");
            entity.Property(e => e.DthoraTroca)
                .HasColumnType("datetime")
                .HasColumnName("DTHoraTroca");
            entity.Property(e => e.PrecoCarrinhoAnterior).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Usuario)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
