using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;
using Pos.Helpers;
using Pos.Pages;

public partial class AdminDBSql : BasePage
{
    private string conString;

    protected override void Execute()
    {
        conString = DB.GetDefaultConnString();

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

    // GET ?dbKey=xxx          — запросы для конкретной базы
    // GET                     — все запросы
    // GET ?search=foo         — поиск LIKE по dbKey, sqlKey, sqlValue
    private void HandleGet()
    {
        string dbKeyParam  = Request.QueryString["dbKey"];
        string searchParam = Request.QueryString["search"];
        bool hasSearch = !string.IsNullOrEmpty(searchParam);

        SqlDataReader dr;

        if (!string.IsNullOrEmpty(dbKeyParam))
        {
            dr = hasSearch
                ? DB.ExecuteQuery(conString, @"
                    SELECT s.id, s.dbKey, s.sqlKey, s.sqlValue, dc.name AS connName
                    FROM DBSql s
                    LEFT JOIN DBConn dc ON dc.dbKey = s.dbKey
                    WHERE s.dbKey = @dbKey AND (s.sqlKey LIKE @search OR s.sqlValue LIKE @search)
                    ORDER BY s.sqlKey",
                    Params.Create("@dbKey", dbKeyParam, "@search", "%" + searchParam + "%"))
                : DB.ExecuteQuery(conString, @"
                    SELECT s.id, s.dbKey, s.sqlKey, s.sqlValue, dc.name AS connName
                    FROM DBSql s
                    LEFT JOIN DBConn dc ON dc.dbKey = s.dbKey
                    WHERE s.dbKey = @dbKey
                    ORDER BY s.sqlKey",
                    Params.Create("@dbKey", dbKeyParam));
        }
        else
        {
            dr = hasSearch
                ? DB.ExecuteQuery(conString, @"
                    SELECT s.id, s.dbKey, s.sqlKey, s.sqlValue, dc.name AS connName
                    FROM DBSql s
                    LEFT JOIN DBConn dc ON dc.dbKey = s.dbKey
                    WHERE s.dbKey LIKE @search OR s.sqlKey LIKE @search OR s.sqlValue LIKE @search
                    ORDER BY s.dbKey, s.sqlKey",
                    Params.Create("@search", "%" + searchParam + "%"))
                : DB.ExecuteQuery(conString, @"
                    SELECT s.id, s.dbKey, s.sqlKey, s.sqlValue, dc.name AS connName
                    FROM DBSql s
                    LEFT JOIN DBConn dc ON dc.dbKey = s.dbKey
                    ORDER BY s.dbKey, s.sqlKey");
        }

        var list = DB.ReaderToDictList(dr);
        WebHelper.Success(Response, data: list);
    }

    private void HandlePost()
    {
        var data = WebHelper.ReadJson<CreateBody>(Request);
        ValidationHelper.ValidateModel(data);

        // Проверка дубликата
        int exists = DB.ExecuteScalar<int>(conString,
            "SELECT COUNT(*) FROM DBSql WHERE dbKey = @dbKey AND sqlKey = @sqlKey",
            Params.Create("@dbKey", data.dbKey, "@sqlKey", data.sqlKey));
        if (exists > 0)
            throw new ClientException("SQL-запрос '" + data.sqlKey + "' для базы '" + data.dbKey + "' уже существует");

        object newId = DB.ExecuteScalar(conString, @"
            INSERT INTO DBSql (dbKey, sqlKey, sqlValue)
            VALUES (@dbKey, @sqlKey, @sqlValue);
            SELECT SCOPE_IDENTITY();",
            Params.Create(
                "@dbKey", data.dbKey,
                "@sqlKey", data.sqlKey,
                "@sqlValue", (object)data.sqlValue ?? DBNull.Value
            ));

        WebHelper.Success(Response,
            data: new { id = Convert.ToInt32(newId) },
            message: "SQL-запрос создан");
    }

    private void HandlePut()
    {
        var data = WebHelper.ReadJson<UpdateBody>(Request);
        ValidationHelper.ValidateModel(data);

        int affected = DB.ExecuteNonQuery(conString, @"
            UPDATE DBSql
            SET dbKey = @dbKey, sqlKey = @sqlKey, sqlValue = @sqlValue
            WHERE id = @id",
            Params.Create(
                "@id", data.id,
                "@dbKey", data.dbKey,
                "@sqlKey", data.sqlKey,
                "@sqlValue", (object)data.sqlValue ?? DBNull.Value
            ));

        if (affected == 0)
            throw new ClientException("Запрос не найден", code: 404);

        WebHelper.Success(Response, message: "Обновлено");
    }

    private void HandleDelete()
    {
        var data = WebHelper.ReadJson<DeleteBody>(Request);
        ValidationHelper.ValidateModel(data);

        int affected = DB.ExecuteNonQuery(conString,
            "DELETE FROM DBSql WHERE id = @id",
            Params.Create("@id", data.id));

        if (affected == 0)
            throw new ClientException("Запрос не найден", code: 404);

        WebHelper.Success(Response, message: "Удалён");
    }

    public class CreateBody
    {
        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }

        [Required(ErrorMessage = "sqlKey обязателен")]
        public string sqlKey { get; set; }

        public string sqlValue { get; set; }
    }

    public class UpdateBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }

        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }

        [Required(ErrorMessage = "sqlKey обязателен")]
        public string sqlKey { get; set; }

        public string sqlValue { get; set; }
    }

    public class DeleteBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }
    }
}
