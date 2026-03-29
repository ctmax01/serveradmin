using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;
using Pos.Helpers;
using Pos.Pages;

public partial class AdminDBConn : BasePage
{
    private string conString = DB.GetDefaultConnString();

    protected override void Execute()
    {
        switch (Request.HttpMethod)
        {
            case "GET":
                HandleGet();
                break;
            case "POST":
                HandlePost();
                break;
            case "PUT":
                HandlePut();
                break;
            case "DELETE":
                HandleDelete();
                break;
            case "OPTIONS":
                WebHelper.OptionsSuccess(Response);
                break;
            default:
                throw new ClientException("Метод не поддерживается", code: 405);
        }
    }

    // GET /core/admin/dbconn/?dbKey=xxx      — одно подключение
    // GET /core/admin/dbconn/                 — все подключения
    // GET /core/admin/dbconn/?search=foo      — поиск LIKE
    private void HandleGet()
    {
        string dbKeyParam = Request.QueryString["dbKey"];
        string searchParam = Request.QueryString["search"];

        if (!string.IsNullOrEmpty(dbKeyParam))
        {
            var row = DB.GetRow(conString,
                "SELECT dbKey, conString, name FROM DBConn WHERE dbKey = @dbKey",
                Params.Create("@dbKey", dbKeyParam));

            if (row == null)
                throw new ClientException("Подключение не найдено", code: 404);

            WebHelper.Success(Response, data: row);
            return;
        }

        bool hasSearch = !string.IsNullOrEmpty(searchParam);

        SqlDataReader dr = hasSearch
            ? DB.ExecuteQuery(conString,
                "SELECT dbKey, conString, name FROM DBConn WHERE dbKey LIKE @search OR name LIKE @search OR conString LIKE @search ORDER BY dbKey",
                Params.Create("@search", "%" + searchParam + "%"))
            : DB.ExecuteQuery(conString,
               @"SELECT TOP 100 *
                FROM DBConn
                ORDER BY 
                CASE WHEN createdAt IS NULL THEN 1 ELSE 0 END,
                createdAt DESC"
            );


        var list = DB.ReaderToDictList(dr);


        WebHelper.Success(Response, data: list);
    }

    // POST — создать подключение
    private void HandlePost()
    {
        var data = WebHelper.ReadJson<CreateBody>(Request);
        ValidationHelper.ValidateModel(data);

        // Проверка дубликата
        int exists = DB.ExecuteScalar<int>(conString,
            "SELECT COUNT(*) FROM DBConn WHERE dbKey = @dbKey",
            Params.Create("@dbKey", data.dbKey));

        if (exists > 0)
            throw new ClientException("DbKey '" + data.dbKey + "' уже существует");

        // Тест подключения
        if (!DB.TestConnection(data.conString))
            throw new ClientException("Не удалось подключиться к новой базе. Проверьте строку подключения.");

        DB.ExecuteNonQuery(conString, @"
            INSERT INTO DBConn (dbKey, conString, name)
            VALUES (@dbKey, @conString, @name)",
            Params.Create(
                "@dbKey", data.dbKey,
                "@conString", data.conString,
                "@name", (object)data.name ?? DBNull.Value
            ));

        WebHelper.Success(Response, message: "Подключение создано");
    }

    // PUT — обновить подключение
    private void HandlePut()
    {
        var data = WebHelper.ReadJson<UpdateBody>(Request);
        ValidationHelper.ValidateModel(data);

        // Тест подключения если строка изменилась
        if (!string.IsNullOrEmpty(data.conString) && !DB.TestConnection(data.conString))
            throw new ClientException("Не удалось подключиться к базе. Проверьте строку подключения.");

        int affected = DB.ExecuteNonQuery(conString, @"
            UPDATE DBConn
            SET conString = @conString, name = @name
            WHERE dbKey = @dbKey",
            Params.Create(
                "@dbKey", data.dbKey,
                "@conString", data.conString,
                "@name", (object)data.name ?? DBNull.Value
            ));

        if (affected == 0)
            throw new ClientException("Подключение не найдено", code: 404);

        WebHelper.Success(Response, message: "Обновлено");
    }

    // DELETE — удалить подключение
    private void HandleDelete()
    {
        var data = WebHelper.ReadJson<DeleteBody>(Request);
        ValidationHelper.ValidateModel(data);

        // Удаляем привязки пользователей
        DB.ExecuteNonQuery(conString,
            "DELETE FROM DBUser WHERE dbKey = @dbKey",
            Params.Create("@dbKey", data.dbKey));

        // Удаляем конфиги
        DB.ExecuteNonQuery(conString,
            "DELETE FROM DBConfig WHERE dbKey = @dbKey",
            Params.Create("@dbKey", data.dbKey));

        // Удаляем SQL запросы
        DB.ExecuteNonQuery(conString,
            "DELETE FROM DBSql WHERE dbKey = @dbKey",
            Params.Create("@dbKey", data.dbKey));

        int affected = DB.ExecuteNonQuery(conString,
            "DELETE FROM DBConn WHERE dbKey = @dbKey",
            Params.Create("@dbKey", data.dbKey));

        if (affected == 0)
            throw new ClientException("Подключение не найдено", code: 404);

        WebHelper.Success(Response, message: "Удалено");
    }

    // ===== MODELS =====

    public class CreateBody
    {
        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }

        [Required(ErrorMessage = "conString обязателен")]
        public string conString { get; set; }

        public string name { get; set; }
    }

    public class UpdateBody
    {
        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }

        [Required(ErrorMessage = "conString обязателен")]
        public string conString { get; set; }

        public string name { get; set; }
    }

    public class DeleteBody
    {
        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }
    }
}
