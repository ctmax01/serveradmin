using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;
using Pos.Helpers;
using Pos.Pages;

public partial class AdminReports : BasePage
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

    // GET             — все отчёты
    // GET ?search=foo — поиск LIKE по code, name, description
    private void HandleGet()
    {
        string searchParam = Request.QueryString["search"];
        bool hasSearch = !string.IsNullOrEmpty(searchParam);

        SqlDataReader dr = hasSearch
            ? DB.ExecuteQuery(conString,
                "SELECT id, code, name, description, sortOrder, isActive FROM Reports WHERE code LIKE @search OR name LIKE @search OR description LIKE @search ORDER BY sortOrder, id",
                Params.Create("@search", "%" + searchParam + "%"))
            : DB.ExecuteQuery(conString,
                "SELECT id, code, name, description, sortOrder, isActive FROM Reports ORDER BY sortOrder, id");

        var list = DB.ReaderToDictList(dr);
        WebHelper.Success(Response, data: list);
    }

    private void HandlePost()
    {
        var data = WebHelper.ReadJson<CreateBody>(Request);
        ValidationHelper.ValidateModel(data);

        // Проверка дубликата кода
        int exists = DB.ExecuteScalar<int>(conString,
            "SELECT COUNT(*) FROM Reports WHERE code = @code",
            Params.Create("@code", data.code));
        if (exists > 0)
            throw new ClientException("Отчёт с кодом '" + data.code + "' уже существует");

        object newId = DB.ExecuteScalar(conString, @"
            INSERT INTO Reports (code, name, description, sortOrder, isActive)
            VALUES (@code, @name, @description, @sortOrder, @isActive);
            SELECT SCOPE_IDENTITY();",
            Params.Create(
                "@code", data.code,
                "@name", data.name,
                "@description", (object)data.description ?? DBNull.Value,
                "@sortOrder", data.sortOrder,
                "@isActive", data.isActive
            ));

        WebHelper.Success(Response,
            data: new { id = Convert.ToInt32(newId) },
            message: "Отчёт создан");
    }

    private void HandlePut()
    {
        var data = WebHelper.ReadJson<UpdateBody>(Request);
        ValidationHelper.ValidateModel(data);

        int affected = DB.ExecuteNonQuery(conString, @"
            UPDATE Reports
            SET code = @code, name = @name, description = @description,
                sortOrder = @sortOrder, isActive = @isActive
            WHERE id = @id",
            Params.Create(
                "@id", data.id,
                "@code", data.code,
                "@name", data.name,
                "@description", (object)data.description ?? DBNull.Value,
                "@sortOrder", data.sortOrder,
                "@isActive", data.isActive
            ));

        if (affected == 0)
            throw new ClientException("Отчёт не найден", code: 404);

        WebHelper.Success(Response, message: "Обновлено");
    }

    private void HandleDelete()
    {
        var data = WebHelper.ReadJson<DeleteBody>(Request);
        ValidationHelper.ValidateModel(data);

        // Удаляем разрешения
        DB.ExecuteNonQuery(conString,
            "DELETE FROM ReportPermissions WHERE reportId = @id",
            Params.Create("@id", data.id));

        int affected = DB.ExecuteNonQuery(conString,
            "DELETE FROM Reports WHERE id = @id",
            Params.Create("@id", data.id));

        if (affected == 0)
            throw new ClientException("Отчёт не найден", code: 404);

        WebHelper.Success(Response, message: "Удалён");
    }

    public class CreateBody
    {
        [Required(ErrorMessage = "code обязателен")]
        public string code { get; set; }

        [Required(ErrorMessage = "name обязателен")]
        public string name { get; set; }

        public string description { get; set; }
        public int sortOrder { get; set; }
        public bool isActive { get; set; }
    }

    public class UpdateBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }

        [Required(ErrorMessage = "code обязателен")]
        public string code { get; set; }

        [Required(ErrorMessage = "name обязателен")]
        public string name { get; set; }

        public string description { get; set; }
        public int sortOrder { get; set; }
        public bool isActive { get; set; }
    }

    public class DeleteBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }
    }
}
