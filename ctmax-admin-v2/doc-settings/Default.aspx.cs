using System;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;
using Pos.Helpers;
using Pos.Pages;

public partial class AdminDocSettings : BasePage
{
    private string conString;

    protected override void Execute()
    {
        conString = DB.GetDefaultConnString();

        switch (Request.HttpMethod)
        {
            case "GET": HandleGet(); break;
            case "POST": HandlePost(); break;
            case "PUT": HandlePut(); break;
            case "DELETE": HandleDelete(); break;
            case "OPTIONS": WebHelper.OptionsSuccess(Response); break;
            default: throw new ClientException("Метод не поддерживается", code: 405);
        }
    }

    private void HandleGet()
    {
        string dbKeyParam = Request.QueryString["dbKey"];
        string searchParam = Request.QueryString["search"];
        bool hasSearch = !string.IsNullOrEmpty(searchParam);

        SqlDataReader dr;

        if (!string.IsNullOrEmpty(dbKeyParam))
        {
            dr = hasSearch
                ? DB.ExecuteQuery(conString, @"
                    SELECT id, DbKey, SettingKey, DocType, Value
                    FROM DocSettings
                    WHERE DbKey = @dbKey AND (SettingKey LIKE @search OR Value LIKE @search)
                    ORDER BY SettingKey",
                    Params.Create("@dbKey", dbKeyParam, "@search", "%" + searchParam + "%"))
                : DB.ExecuteQuery(conString, @"
                    SELECT id, DbKey, SettingKey, DocType, Value
                    FROM DocSettings
                    WHERE DbKey = @dbKey
                    ORDER BY SettingKey",
                    Params.Create("@dbKey", dbKeyParam));
        }
        else
        {
            dr = hasSearch
                ? DB.ExecuteQuery(conString, @"
                    SELECT id, DbKey, SettingKey, DocType, Value
                    FROM DocSettings
                    WHERE DbKey LIKE @search OR SettingKey LIKE @search OR Value LIKE @search
                    ORDER BY DbKey, SettingKey",
                    Params.Create("@search", "%" + searchParam + "%"))
                : DB.ExecuteQuery(conString, @"
                    SELECT id, DbKey, SettingKey, DocType, Value
                    FROM DocSettings
                    ORDER BY DbKey, SettingKey");
        }

        WebHelper.Success(Response, data: DB.ReaderToDictList(dr));
    }

    private void HandlePost()
    {
        var data = WebHelper.ReadJson<SettingBody>(Request);
        ValidationHelper.ValidateModel(data);

        object newId = DB.ExecuteScalar(conString, @"
            INSERT INTO DocSettings (DbKey, SettingKey, DocType, Value)
            VALUES (@dbKey, @settingKey, @docType, @value);
            SELECT SCOPE_IDENTITY();",
            Params.Create(
                "@dbKey", data.dbKey,
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
        var data = WebHelper.ReadJson<SettingBody>(Request);
        ValidationHelper.ValidateModel(data);

        if (data.id == null)
            throw new ClientException("id обязателен");

        int affected = DB.ExecuteNonQuery(conString, @"
            UPDATE DocSettings
            SET DbKey      = @dbKey,
                SettingKey = @settingKey,
                DocType    = @docType,
                Value      = @value
            WHERE id = @id",
            Params.Create(
                "@id", data.id.Value,
                "@dbKey", data.dbKey,
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
            "DELETE FROM DocSettings WHERE id = @id",
            Params.Create("@id", data.id));

        if (affected == 0)
            throw new ClientException("Настройка не найдена", code: 404);

        WebHelper.Success(Response, message: "Удалено");
    }

    public class SettingBody
    {
        public int? id { get; set; }

        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }

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