using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Pos.Helpers;
using Pos.Pages;

public partial class AdminReportColumns : BasePage
{
    private string conString;

    protected override void Execute()
    {
        conString = DB.GetDefaultConnString();

        switch (Request.HttpMethod)
        {
            case "GET":     HandleGet();    break;
            case "POST":    HandlePost();   break;
            case "PUT":     HandlePut();    break;
            case "DELETE":  HandleDelete(); break;
            case "OPTIONS": WebHelper.OptionsSuccess(Response); break;
            default: throw new ClientException("Метод не поддерживается", code: 405);
        }
    }

    private void HandleGet()
    {
        string reportIdParam = Request.QueryString["reportId"];
        if (string.IsNullOrEmpty(reportIdParam))
            throw new ClientException("reportId обязателен");

        int reportId = Convert.ToInt32(reportIdParam);

        var dr = DB.ExecuteQuery(conString, @"
            SELECT id, reportId, colKey, colLabel, colStyle, sortOrder
            FROM ReportColumns
            WHERE reportId = @reportId
            ORDER BY sortOrder",
            Params.Create("@reportId", reportId));

        WebHelper.Success(Response, data: DB.ReaderToDictList(dr));
    }

    private void HandlePost()
    {
        var data = WebHelper.ReadJson<ColumnBody>(Request);
        ValidationHelper.ValidateModel(data);

        if (data.reportId == null)
            throw new ClientException("reportId обязателен");

        object newId = DB.ExecuteScalar(conString, @"
            INSERT INTO ReportColumns (reportId, colKey, colLabel, colStyle, sortOrder)
            VALUES (@reportId, @colKey, @colLabel, @colStyle, @sortOrder);
            SELECT SCOPE_IDENTITY();",
            Params.Create(
                "@reportId",  data.reportId.Value,
                "@colKey",    data.colKey,
                "@colLabel",  data.colLabel,
                "@colStyle",  (object)data.colStyle ?? DBNull.Value,
                "@sortOrder", data.sortOrder
            ));

        WebHelper.Success(Response,
            data: new { id = Convert.ToInt32(newId) },
            message: "Колонка добавлена");
    }

    private void HandlePut()
    {
        var data = WebHelper.ReadJson<ColumnBody>(Request);
        ValidationHelper.ValidateModel(data);

        if (data.id == null)
            throw new ClientException("id обязателен");

        int affected = DB.ExecuteNonQuery(conString, @"
            UPDATE ReportColumns
            SET colKey    = @colKey,
                colLabel  = @colLabel,
                colStyle  = @colStyle,
                sortOrder = @sortOrder
            WHERE id = @id",
            Params.Create(
                "@id",        data.id.Value,
                "@colKey",    data.colKey,
                "@colLabel",  data.colLabel,
                "@colStyle",  (object)data.colStyle ?? DBNull.Value,
                "@sortOrder", data.sortOrder
            ));

        if (affected == 0)
            throw new ClientException("Колонка не найдена", code: 404);

        WebHelper.Success(Response, message: "Колонка обновлена");
    }

    private void HandleDelete()
    {
        var data = WebHelper.ReadJson<DeleteBody>(Request);
        ValidationHelper.ValidateModel(data);

        int affected = DB.ExecuteNonQuery(conString,
            "DELETE FROM ReportColumns WHERE id = @id",
            Params.Create("@id", data.id));

        if (affected == 0)
            throw new ClientException("Колонка не найдена", code: 404);

        WebHelper.Success(Response, message: "Колонка удалена");
    }

    public class ColumnBody
    {
        public int?   id        { get; set; }
        public int?   reportId  { get; set; }

        [Required(ErrorMessage = "colKey обязателен")]
        public string colKey    { get; set; }

        [Required(ErrorMessage = "colLabel обязателен")]
        public string colLabel  { get; set; }

        public string colStyle  { get; set; }
        public int    sortOrder { get; set; }
    }

    public class DeleteBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }
    }
}