using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;
using Pos.Helpers;
using Pos.Pages;

public partial class AdminUsers : BasePage
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

    // GET /core/admin/users/?id=123          — один пользователь
    // GET /core/admin/users/                 — все пользователи
    // GET /core/admin/users/?search=ivan     — поиск LIKE по имени и телефону
    private void HandleGet()
    {
        string idParam     = Request.QueryString["id"];
        string searchParam = Request.QueryString["search"];

        if (!string.IsNullOrEmpty(idParam))
        {
            int id = int.Parse(idParam);
            var row = DB.GetRow(conString,
                "SELECT id, name, phone, password, startDate, lastDbKey FROM Users WHERE id = @id",
                Params.Create("@id", id));

            if (row == null)
                throw new ClientException("Пользователь не найден", code: 404);

            WebHelper.Success(Response, data: row);
            return;
        }

        bool hasSearch = !string.IsNullOrEmpty(searchParam);

        SqlDataReader dr = hasSearch
            ? DB.ExecuteQuery(conString,
                "SELECT id, name, phone, password, startDate, lastDbKey FROM Users WHERE name LIKE @search OR phone LIKE @search ORDER BY id",
                Params.Create("@search", "%" + searchParam + "%"))
            : DB.ExecuteQuery(conString,
                "SELECT id, name, phone, password, startDate, lastDbKey FROM Users ORDER BY id");

        var list = DB.ReaderToDictList(dr);
        WebHelper.Success(Response, data: list);
    }

    // POST — создать пользователя
    private void HandlePost()
    {
        var data = WebHelper.ReadJson<CreateBody>(Request);
        ValidationHelper.ValidateModel(data);

        // Проверка дубликата по телефону
        int exists = DB.ExecuteScalar<int>(conString,
            "SELECT COUNT(*) FROM Users WHERE phone = @phone",
            Params.Create("@phone", data.phone));

        if (exists > 0)
            throw new ClientException("Пользователь с таким телефоном уже существует");

        object newId = DB.ExecuteScalar(conString, @"
            INSERT INTO Users (name, phone, password, startDate)
            VALUES (@name, @phone, @password, @startDate);
            SELECT SCOPE_IDENTITY();",
            Params.Create(
                "@name", data.name,
                "@phone", data.phone,
                "@password", data.password,
                "@startDate", DateTime.Now
            ));

        WebHelper.Success(Response,
            data: new { id = Convert.ToInt32(newId) },
            message: "Пользователь создан");
    }

    // PUT — обновить пользователя
    private void HandlePut()
    {
        var data = WebHelper.ReadJson<UpdateBody>(Request);
        ValidationHelper.ValidateModel(data);

        int affected = DB.ExecuteNonQuery(conString, @"
            UPDATE Users
            SET name = @name, phone = @phone, password = @password, lastDbKey = @lastDbKey
            WHERE id = @id",
            Params.Create(
                "@id", data.id,
                "@name", data.name,
                "@phone", data.phone,
                "@password", (object)data.password ?? DBNull.Value,
                "@lastDbKey", (object)data.lastDbKey ?? DBNull.Value
            ));

        if (affected == 0)
            throw new ClientException("Пользователь не найден", code: 404);

        WebHelper.Success(Response, message: "Обновлено");
    }

    // DELETE — удалить пользователя
    private void HandleDelete()
    {
        var data = WebHelper.ReadJson<DeleteBody>(Request);
        ValidationHelper.ValidateModel(data);

        // Удаляем привязки к базам
        DB.ExecuteNonQuery(conString,
            "DELETE FROM DBUser WHERE userId = @id",
            Params.Create("@id", data.id));

        // Удаляем токены
        DB.ExecuteNonQuery(conString,
            "DELETE FROM UserTokens WHERE userId = @id",
            Params.Create("@id", data.id));

        int affected = DB.ExecuteNonQuery(conString,
            "DELETE FROM Users WHERE id = @id",
            Params.Create("@id", data.id));

        if (affected == 0)
            throw new ClientException("Пользователь не найден", code: 404);

        WebHelper.Success(Response, message: "Удалён");
    }

    // ===== MODELS =====

    public class CreateBody
    {
        [Required(ErrorMessage = "Имя обязательно")]
        public string name { get; set; }

        [Required(ErrorMessage = "Телефон обязателен")]
        public string phone { get; set; }

        [Required(ErrorMessage = "Пароль обязателен")]
        [MinLength(8, ErrorMessage = "Пароль должен содержать не менее 8 символов")]
        public string password { get; set; }
    }

    public class UpdateBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }

        [Required(ErrorMessage = "Имя обязательно")]
        public string name { get; set; }

        [Required(ErrorMessage = "Телефон обязателен")]
        public string phone { get; set; }

        public string password { get; set; }
        public string lastDbKey { get; set; }
    }

    public class DeleteBody
    {
        [Required(ErrorMessage = "id обязателен")]
        public int id { get; set; }
    }
}
