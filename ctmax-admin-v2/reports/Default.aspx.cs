using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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
        string idParam = Request.QueryString["id"];
        string searchParam = Request.QueryString["search"];

        if (!string.IsNullOrEmpty(idParam))
        {
            int reportId = Convert.ToInt32(idParam);
            var dr = DB.ExecuteQuery(conString, @"
                SELECT id, name, description, sqlQuery, queryType,
                       includeUnknownColumns, sortOrder, isActive
                FROM Reports
                WHERE id = @id",
                Params.Create("@id", reportId));

            var list = DB.ReaderToDictList(dr);
            if (list.Count == 0)
                throw new ClientException("Отчёт не найден", code: 404);

            WebHelper.Success(Response, data: list[0]);
            return;
        }

        bool hasSearch = !string.IsNullOrEmpty(searchParam);
        var drList = hasSearch
            ? DB.ExecuteQuery(conString, @"
                SELECT id, name, description, sqlQuery, queryType,
                       includeUnknownColumns, sortOrder, isActive
                FROM Reports
                WHERE name LIKE @search OR description LIKE @search
                ORDER BY sortOrder, id",
                Params.Create("@search", "%" + searchParam + "%"))
            : DB.ExecuteQuery(conString, @"
                SELECT id, name, description, sqlQuery, queryType,
                       includeUnknownColumns, sortOrder, isActive
                FROM Reports
                ORDER BY sortOrder, id");

        WebHelper.Success(Response, data: DB.ReaderToDictList(drList));
    }

    private void HandlePost()
    {
        var data = WebHelper.ReadJson<ReportBody>(Request);
        ValidationHelper.ValidateModel(data);

        object newId = DB.ExecuteScalar(conString, @"
            INSERT INTO Reports (name, description, sqlQuery, queryType, includeUnknownColumns, sortOrder, isActive)
            VALUES (@name, @description, @sqlQuery, @queryType, @includeUnknownColumns, @sortOrder, @isActive);
            SELECT SCOPE_IDENTITY();",
            Params.Create(
                "@name", data.name,
                "@description", (object)data.description ?? DBNull.Value,
                "@sqlQuery", data.sqlQuery,
                "@queryType", data.queryType,
                "@includeUnknownColumns", data.includeUnknownColumns,
                "@sortOrder", data.sortOrder,
                "@isActive", data.isActive
            ));

        WebHelper.Success(Response,
            data: new { id = Convert.ToInt32(newId) },
            message: "Отчёт создан");
    }

    private void HandlePut()
    {
        var data = WebHelper.ReadJson<ReportBody>(Request);
        ValidationHelper.ValidateModel(data);

        if (data.id == null)
            throw new ClientException("id обязателен");

        int affected = DB.ExecuteNonQuery(conString, @"
            UPDATE Reports
            SET name                  = @name,
                description           = @description,
                sqlQuery              = @sqlQuery,
                queryType             = @queryType,
                includeUnknownColumns = @includeUnknownColumns,
                sortOrder             = @sortOrder,
                isActive              = @isActive
            WHERE id = @id",
            Params.Create(
                "@id", data.id.Value,
                "@name", data.name,
                "@description", (object)data.description ?? DBNull.Value,
                "@sqlQuery", data.sqlQuery,
                "@queryType", data.queryType,
                "@includeUnknownColumns", data.includeUnknownColumns,
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

        int affected = DB.ExecuteNonQuery(conString,
            "DELETE FROM Reports WHERE id = @id",
            Params.Create("@id", data.id));

        if (affected == 0)
            throw new ClientException("Отчёт не найден", code: 404);

        WebHelper.Success(Response, message: "Удалён");
    }

    public class ReportBody
    {
        public int? id { get; set; }

        [Required(ErrorMessage = "name обязателен")]
        public string name { get; set; }
        public string description { get; set; }

        [Required(ErrorMessage = "sqlQuery обязателен")]
        public string sqlQuery { get; set; }

        [Required(ErrorMessage = "queryType обязателен")]
        public string queryType { get; set; }
        public bool includeUnknownColumns { get; set; }
        public int sortOrder { get; set; }
        public bool isActive { get; set; }
    }

    public class DeleteBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }
    }
}