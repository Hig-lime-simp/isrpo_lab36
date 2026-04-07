using System.ComponentModel.DataAnnotations;

namespace TaskBoardApi.Models;

public class TaskItem
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Название задачи обязательно")]
    [MaxLength(200, ErrorMessage = "Название не должно превышать 200 символов")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Описание не должно превышать 1000 символов")]
    public string Description { get; set; } = string.Empty;

    public bool IsCompleted { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}