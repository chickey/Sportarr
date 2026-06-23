using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sportarr.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventAlternateName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Comma-separated local aliases for event matching. Keeps the
            // canonical upstream event title intact while letting admins add
            // file-friendly names such as "Spanish Grand Prix" or "Barcelona GP".
            migrationBuilder.AddColumn<string>(
                name: "AlternateName",
                table: "Events",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlternateName",
                table: "Events");
        }
    }
}
