using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;
using Pos.Helpers;
using Pos.Pages;

public partial class AdminSettings : BasePage
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

    // GET ?dbKey=xxx          — настройки для конкретной базы
    // GET                     — все настройки
    // GET ?search=foo         — поиск LIKE по DbKey, Section, SettingKey, Value
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
                    SELECT id, DbKey, Section, SettingKey, DocType, Value
                    FROM ClientSettings
                    WHERE DbKey = @dbKey AND (Section LIKE @search OR SettingKey LIKE @search OR Value LIKE @search)
                    ORDER BY Section, SettingKey",
                    Params.Create("@dbKey", dbKeyParam, "@search", "%" + searchParam + "%"))
                : DB.ExecuteQuery(conString, @"
                    SELECT id, DbKey, Section, SettingKey, DocType, Value
                    FROM ClientSettings
                    WHERE DbKey = @dbKey
                    ORDER BY Section, SettingKey",
                    Params.Create("@dbKey", dbKeyParam));
        }
        else
        {
            dr = hasSearch
                ? DB.ExecuteQuery(conString, @"
                    SELECT id, DbKey, Section, SettingKey, DocType, Value
                    FROM ClientSettings
                    WHERE DbKey LIKE @search OR Section LIKE @search OR SettingKey LIKE @search OR Value LIKE @search
                    ORDER BY DbKey, Section, SettingKey",
                    Params.Create("@search", "%" + searchParam + "%"))
                : DB.ExecuteQuery(conString, @"
                    SELECT id, DbKey, Section, SettingKey, DocType, Value
                    FROM ClientSettings
                    ORDER BY DbKey, Section, SettingKey");
        }

        var list = DB.ReaderToDictList(dr);
        WebHelper.Success(Response, data: list);
    }

    private void HandlePost()
    {
        var data = WebHelper.ReadJson<CreateBody>(Request);
        ValidationHelper.ValidateModel(data);

        object newId = DB.ExecuteScalar(conString, @"
            INSERT INTO ClientSettings (DbKey, Section, SettingKey, DocType, Value)
            VALUES (@dbKey, @section, @settingKey, @docType, @value);
            SELECT SCOPE_IDENTITY();",
            Params.Create(
                "@dbKey", data.dbKey,
                "@section", data.section,
                "@settingKey", data.settingKey,
                "@docType", (object)data.docType ?? DBNull.Value,
                "@value", data.value
            ));

        WebHelper.Success(Response,
            data: new { id = Convert.ToInt32(newId) },
            message: "Настройка создана");
    }

    private void HandlePut()
    {
        var data = WebHelper.ReadJson<UpdateBody>(Request);
        ValidationHelper.ValidateModel(data);

        int affected = DB.ExecuteNonQuery(conString, @"
            UPDATE ClientSettings
            SET DbKey = @dbKey, Section = @section, SettingKey = @settingKey,
                DocType = @docType, Value = @value
            WHERE ID = @id",
            Params.Create(
                "@id", data.id,
                "@dbKey", data.dbKey,
                "@section", data.section,
                "@settingKey", data.settingKey,
                "@docType", (object)data.docType ?? DBNull.Value,
                "@value", data.value
            ));

        if (affected == 0)
            throw new ClientException("Настройка не найдена", code: 404);

        WebHelper.Success(Response, message: "Обновлено");
    }

    private void HandleDelete()
    {
        var data = WebHelper.ReadJson<DeleteBody>(Request);
        ValidationHelper.ValidateModel(data);

        int affected = DB.ExecuteNonQuery(conString,
            "DELETE FROM ClientSettings WHERE ID = @id",
            Params.Create("@id", data.id));

        if (affected == 0)
            throw new ClientException("Настройка не найдена", code: 404);

        WebHelper.Success(Response, message: "Удалено");
    }

    public class CreateBody
    {
        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }

        [Required(ErrorMessage = "section обязателен")]
        public string section { get; set; }

        [Required(ErrorMessage = "settingKey обязателен")]
        public string settingKey { get; set; }

        public int? docType { get; set; }

        [Required(ErrorMessage = "value обязателен")]
        public string value { get; set; }
    }

    public class UpdateBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }

        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }

        [Required(ErrorMessage = "section обязателен")]
        public string section { get; set; }

        [Required(ErrorMessage = "settingKey обязателен")]
        public string settingKey { get; set; }

        public int? docType { get; set; }

        [Required(ErrorMessage = "value обязателен")]
        public string value { get; set; }
    }

    public class DeleteBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }
    }
}
