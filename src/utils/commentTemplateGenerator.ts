import type { StudentData } from '../types/report';
import { EVALUATION_GROUPS } from '../constants/evaluationData';

/**
 * Generates an instant, natural Vietnamese teacher comment based strictly
 * on the evaluated characteristics without needing any external AI call.
 */
export function generateSmartQuickComment(student: StudentData): string {
  const name = student.fullName.trim() || 'Con';
  const score = student.score !== '' ? Number(student.score) : null;

  // Collect evaluated traits
  const strengths: string[] = [];
  const averages: string[] = [];
  const needsImprovement: string[] = [];

  EVALUATION_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      const lvl = student.evaluations[item.id];
      if (lvl === 5) {
        strengths.push(`${item.nameVi.toLowerCase()} rất tốt`);
      } else if (lvl === 4) {
        strengths.push(`${item.nameVi.toLowerCase()} tốt`);
      } else if (lvl === 3) {
        averages.push(`${item.nameVi.toLowerCase()} ở mức ổn định`);
      } else if (lvl === 2) {
        needsImprovement.push(`${item.nameVi.toLowerCase()} cần cố gắng thêm`);
      } else if (lvl === 1) {
        needsImprovement.push(`${item.nameVi.toLowerCase()} chưa thể hiện được nhiều`);
      }
    });
  });

  const sentences: string[] = [];

  // Opening & general attitude
  if (strengths.length > 0) {
    const topStrengths = strengths.slice(0, 2).join(' và ');
    sentences.push(`Trong suốt quá trình học vừa qua, ${name} thể hiện tinh thần học tập tích cực, đặc biệt là ${topStrengths}.`);
  } else if (averages.length > 0) {
    sentences.push(`Trong quá trình học tập, ${name} duy trì sự ổn định và có ý thức hợp tác cùng thầy cô trên lớp.`);
  } else {
    sentences.push(`Trong tháng học vừa qua, ${name} đã tham gia đầy đủ các buổi học và hoàn thành bài thi Mock Test.`);
  }

  // Academic / mock test score connection
  if (score !== null && !isNaN(score)) {
    if (score >= 8.0) {
      sentences.push(`Kết quả bài thi Mock Test đạt ${score}/10 phản ánh đúng năng lực và sự nỗ lực tiếp thu kiến thức của con.`);
    } else if (score >= 6.0) {
      sentences.push(`Bài thi Mock Test con đạt ${score}/10, đây là kết quả đáng khích lệ cho thấy con đã nắm được các nội dung trọng tâm.`);
    } else {
      sentences.push(`Kết quả Mock Test đạt ${score}/10 cho thấy con cần được củng cố thêm các phần kiến thức còn chưa vững.`);
    }
  }

  // Areas to improve
  if (needsImprovement.length > 0) {
    const topImprove = needsImprovement.slice(0, 2).join(' cũng như ');
    sentences.push(`Để tiến bộ hơn nữa trong giai đoạn tới, con cần chú ý rèn luyện thêm về ${topImprove}.`);
  } else if (averages.length > 0 && strengths.length > 0) {
    sentences.push(`Thầy cô mong con tiếp tục phát huy các thế mạnh hiện có và tự tin hơn nữa khi thực hành.`);
  }

  // Closing encouraging statement
  sentences.push(`Thầy cô tin rằng với sự kiên trì và chăm chỉ rèn luyện, ${name} sẽ ngày càng bứt phá và đạt nhiều kết quả xuất sắc hơn nữa!`);

  return sentences.join(' ');
}
