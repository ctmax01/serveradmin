using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;
using Pos.Helpers;
using Pos.Pages;

public partial class AdminDBUser : BasePage
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

    // GET /core/admin/dbuser/?userId=123  — привязки пользователя
    // GET /core/admin/dbuser/?dbKey=xxx   — привязки для базы
    // GET /core/admin/dbuser/?id=5        — одна привязка
    // GET /core/admin/dbuser/              — все привязки (+ reportPermissions)
    private void HandleGet()
    {
        string userIdParam = Request.QueryString["userId"];
        string dbKeyParam = Request.QueryString["dbKey"];
        string idParam = Request.QueryString["id"];
        string searchParam = Request.QueryString["search"];

        if (!string.IsNullOrEmpty(idParam))
        {
            int id = int.Parse(idParam);
            var row = DB.GetRow(conString, @"
                SELECT du.*, u.name AS userName, dc.name AS connName
                FROM DBUser du
                LEFT JOIN Users u ON u.id = du.userId
                LEFT JOIN DBConn dc ON dc.dbKey = du.dbKey
                WHERE du.id = @id",
                Params.Create("@id", id));

            if (row == null)
                throw new ClientException("Привязка не найдена", code: 404);

            // Добавляем разрешения на отчёты
            int userId = Convert.ToInt32(row["userId"]);
            row["reportIds"] = GetReportIds(userId);

            WebHelper.Success(Response, data: row);
        }
        else if (!string.IsNullOrEmpty(userIdParam))
        {
            int userId = int.Parse(userIdParam);
            SqlDataReader dr = DB.ExecuteQuery(conString, @"
                SELECT du.*, u.name AS userName, dc.name AS connName
                FROM DBUser du
                LEFT JOIN Users u ON u.id = du.userId
                LEFT JOIN DBConn dc ON dc.dbKey = du.dbKey
                WHERE du.userId = @userId ORDER BY du.id",
                Params.Create("@userId", userId));
            var list = DB.ReaderToDictList(dr);
            WebHelper.Success(Response, data: list);
        }
        else if (!string.IsNullOrEmpty(dbKeyParam))
        {
            bool hasSearch = !string.IsNullOrEmpty(searchParam);
            SqlDataReader dr = hasSearch
                ? DB.ExecuteQuery(conString, @"
                    SELECT du.*, u.name AS userName, dc.name AS connName
                    FROM DBUser du
                    LEFT JOIN Users u ON u.id = du.userId
                    LEFT JOIN DBConn dc ON dc.dbKey = du.dbKey
                    WHERE du.dbKey = @dbKey AND (u.name LIKE @search OR du.dbname LIKE @search OR du.url LIKE @search)
                    ORDER BY du.id",
                    Params.Create("@dbKey", dbKeyParam, "@search", "%" + searchParam + "%"))
                : DB.ExecuteQuery(conString, @"
                    SELECT du.*, u.name AS userName, dc.name AS connName
                    FROM DBUser du
                    LEFT JOIN Users u ON u.id = du.userId
                    LEFT JOIN DBConn dc ON dc.dbKey = du.dbKey
                    WHERE du.dbKey = @dbKey ORDER BY du.id",
                    Params.Create("@dbKey", dbKeyParam));
            var list = DB.ReaderToDictList(dr);
            foreach (var row in list)
            {
                int uid = Convert.ToInt32(row["userId"]);
                row["reportIds"] = GetReportIds(uid);
            }
            WebHelper.Success(Response, data: list);
        }
        else
        {
            SqlDataReader dr = DB.ExecuteQuery(conString, @"
                SELECT du.*, u.name AS userName, dc.name AS connName
                FROM DBUser du
                LEFT JOIN Users u ON u.id = du.userId
                LEFT JOIN DBConn dc ON dc.dbKey = du.dbKey
                ORDER BY du.id");
            var list = DB.ReaderToDictList(dr);

            // Для каждой привязки добавляем reportIds
            foreach (var row in list)
            {
                int uid = Convert.ToInt32(row["userId"]);
                row["reportIds"] = GetReportIds(uid);
            }

            WebHelper.Success(Response, data: list);
        }
    }

    private List<int> GetReportIds(int userId)
    {
        SqlDataReader dr = DB.ExecuteQuery(conString,
            "SELECT reportId FROM ReportPermissions WHERE userId = @uid",
            Params.Create("@uid", userId));
        var rows = DB.ReaderToDictList(dr);
        var ids = new List<int>();
        foreach (var r in rows)
            ids.Add(Convert.ToInt32(r["reportId"]));
        return ids;
    }

    // POST — создать привязку
    private void HandlePost()
    {
        var data = WebHelper.ReadJson<DbUserBody>(Request);
        ValidationHelper.ValidateModel(data);

        int userExists = DB.ExecuteScalar<int>(conString,
            "SELECT COUNT(*) FROM Users WHERE id = @id",
            Params.Create("@id", data.userId));
        if (userExists == 0)
            throw new ClientException("Пользователь с id=" + data.userId + " не найден");

        int connExists = DB.ExecuteScalar<int>(conString,
            "SELECT COUNT(*) FROM DBConn WHERE dbKey = @dbKey",
            Params.Create("@dbKey", data.dbKey));
        if (connExists == 0)
            throw new ClientException("Подключение '" + data.dbKey + "' не найдено");

        int exists = DB.ExecuteScalar<int>(conString,
            "SELECT COUNT(*) FROM DBUser WHERE userId = @userId AND dbKey = @dbKey",
            Params.Create("@userId", data.userId, "@dbKey", data.dbKey));
        if (exists > 0)
            throw new ClientException("Привязка уже существует");

        object newId = DB.ExecuteScalar(conString, @"
        INSERT INTO DBUser (
            dbKey, userId, dbname, url,
            xreport, zakazVirtual, stoplist, passwords, notifications,
            docs, stockReport, relazReport, cashSummary, cashbook,
            msettlements, users, category, printers, reservation,
            dynamicReports, docUserId
        ) VALUES (
            @dbKey, @userId, @dbname, @url,
            @xreport, @zakazVirtual, @stoplist, @passwords, @notifications,
            @docs, @stockReport, @relazReport, @cashSummary, @cashbook,
            @msettlements, @users, @category, @printers, @reservation,
            @dynamicReports, @docUserId
        ); SELECT SCOPE_IDENTITY();",
            Params.Create(
                "@dbKey", data.dbKey,
                "@userId", data.userId,
                "@dbname", (object)data.dbname ?? DBNull.Value,
                "@url", (object)data.url ?? DBNull.Value,
                "@xreport", data.xreport ?? false,
                "@zakazVirtual", data.zakazVirtual ?? false,
                "@stoplist", data.stoplist ?? false,
                "@passwords", data.passwords ?? false,
                "@notifications", data.notifications ?? false,
                "@docs", data.docs ?? false,
                "@stockReport", data.stockReport ?? false,
                "@relazReport", data.relazReport ?? false,
                "@cashSummary", data.cashSummary ?? false,
                "@cashbook", data.cashbook ?? false,
                "@msettlements", data.msettlements ?? false,
                "@users", data.users ?? false,
                "@category", data.category ?? false,
                "@printers", data.printers ?? false,
                "@reservation", data.reservation ?? false,
                "@dynamicReports", data.dynamicReports ?? false,
                "@docUserId", (object)data.docUserId ?? DBNull.Value
            ));

        if (data.reportIds != null)
            SaveReportPermissions(data.userId, data.reportIds);

        WebHelper.Success(Response,
            data: new { id = Convert.ToInt32(newId) },
            message: "Привязка создана");
    }

    // PUT — обновить привязку
    private void HandlePut()
    {
        var data = WebHelper.ReadJson<DbUserBody>(Request);
        ValidationHelper.ValidateModel(data);

        if (!data.id.HasValue)
            throw new ClientException("id обязателен");

        int affected = DB.ExecuteNonQuery(conString, @"
        UPDATE DBUser SET
            dbKey = @dbKey, userId = @userId, dbname = @dbname, url = @url,
            xreport = @xreport, zakazVirtual = @zakazVirtual,
            stoplist = @stoplist, passwords = @passwords,
            notifications = @notifications, docs = @docs,
            stockReport = @stockReport, relazReport = @relazReport,
            cashSummary = @cashSummary, cashbook = @cashbook,
            msettlements = @msettlements, users = @users,
            category = @category, printers = @printers,
            reservation = @reservation, dynamicReports = @dynamicReports,
            docUserId = @docUserId
        WHERE id = @id",
            Params.Create(
                "@id", data.id.Value,
                "@dbKey", data.dbKey,
                "@userId", data.userId,
                "@dbname", (object)data.dbname ?? DBNull.Value,
                "@url", (object)data.url ?? DBNull.Value,
                "@xreport", data.xreport ?? false,
                "@zakazVirtual", data.zakazVirtual ?? false,
                "@stoplist", data.stoplist ?? false,
                "@passwords", data.passwords ?? false,
                "@notifications", data.notifications ?? false,
                "@docs", data.docs ?? false,
                "@stockReport", data.stockReport ?? false,
                "@relazReport", data.relazReport ?? false,
                "@cashSummary", data.cashSummary ?? false,
                "@cashbook", data.cashbook ?? false,
                "@msettlements", data.msettlements ?? false,
                "@users", data.users ?? false,
                "@category", data.category ?? false,
                "@printers", data.printers ?? false,
                "@reservation", data.reservation ?? false,
                "@dynamicReports", data.dynamicReports ?? false,
                "@docUserId", (object)data.docUserId ?? DBNull.Value
            ));

        if (affected == 0)
            throw new ClientException("Привязка не найдена", code: 404);

        if (data.reportIds != null)
            SaveReportPermissions(data.userId, data.reportIds);

        WebHelper.Success(Response, message: "Обновлено");
    }
    // DELETE — удалить привязку
    private void HandleDelete()
    {
        var data = WebHelper.ReadJson<DeleteBody>(Request);
        ValidationHelper.ValidateModel(data);

        int affected = DB.ExecuteNonQuery(conString,
            "DELETE FROM DBUser WHERE id = @id",
            Params.Create("@id", data.id));

        if (affected == 0)
            throw new ClientException("Привязка не найдена", code: 404);

        WebHelper.Success(Response, message: "Удалено");
    }

    // Сохранение разрешений на отчёты: удаляем старые, вставляем новые
    private void SaveReportPermissions(int userId, List<int> reportIds)
    {
        DB.ExecuteNonQuery(conString,
            "DELETE FROM ReportPermissions WHERE userId = @uid",
            Params.Create("@uid", userId));

        foreach (int rid in reportIds)
        {
            DB.ExecuteNonQuery(conString, @"
                INSERT INTO ReportPermissions (userId, reportId, grantedDate)
                VALUES (@uid, @rid, @now)",
                Params.Create("@uid", userId, "@rid", rid, "@now", DateTime.Now));
        }
    }

    // ===== MODELS =====

    public class DbUserBody
    {
        public int? id { get; set; }

        [Required(ErrorMessage = "userId обязателен")]
        public int userId { get; set; }

        [Required(ErrorMessage = "dbKey обязателен")]
        public string dbKey { get; set; }

        public string dbname { get; set; }
        public string url { get; set; }
        public int? docUserId { get; set; }
        public List<int> reportIds { get; set; }

        public bool? xreport { get; set; }
        public bool? zakazVirtual { get; set; }
        public bool? stoplist { get; set; }
        public bool? passwords { get; set; }
        public bool? notifications { get; set; }
        public bool? docs { get; set; }
        public bool? stockReport { get; set; }
        public bool? relazReport { get; set; }
        public bool? cashSummary { get; set; }
        public bool? cashbook { get; set; }
        public bool? msettlements { get; set; }
        public bool? users { get; set; }
        public bool? category { get; set; }
        public bool? printers { get; set; }
        public bool? reservation { get; set; }
        public bool? dynamicReports { get; set; }
    }

    public class DeleteBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }
    }
}
