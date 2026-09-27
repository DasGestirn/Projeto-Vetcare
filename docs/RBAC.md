# Matriz de Permissão (RBAC) do sistema Vetcare

|Ação                       |Administrador|Recepcionista|Veterinário|
|---------------------------|-------------|-------------|-----------|
|Manter usuário             |CRUD         |-            |-          |
|Manter tutor               |CRUD         |CRUD         |CRU        |
|Manter animal              |CRUD         |CRUD         |CRU        |
|Manter veterinário         |CRUD         |R            |RU         |
|Cancelar consulta          |E            |E            |E          |
|Consultar agenda           |R            |R            |R          |
|Registrar atendimento      |R            |-            |CRU        |
|Manter prontuário          |R            |-            |CRU        |
|Registrar vacinação        |R            |R            |CRU        |
|Emitir prescrição          |R            |R            |CRU        |
|Registrar pagamento        |CRUD         |CRUD         |-          |
|Dashboard financeiro       |R            |-            |-          |
|Notificar tutor            |E            |E            |-          |
|Gerar relatório geral      |E            |-            |-          |
|Gerar relatório financeiro |E            |-            |-          |
|Gerar relatório operacional|E            |E            |-          |
|Gerar relatório clínico    |E            |-            |E          |

## Legenda 

* C (Create): Permissão para gerar novos registros no sistema.
* R (Read): Permissão para visualizar dados.
* U (Update): Permissão para editar ou atualizar dados existentes.   
* D (Delete): Permissão para excluir registros fisicamente ou marcá-los como inativos.   
* E (Execute): Permissão para acionar fluxos de trabalho específicos (ex: disparar notificações, gerar relatórios, autenticar).   


