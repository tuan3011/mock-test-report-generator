import type { StudentData } from '../types/report';
import { EVALUATION_GROUPS } from '../constants/evaluationData';

/**
 * Generates an instant, natural Vietnamese teacher comment based strictly
 * on the evaluated characteristics following academic report style (PRE-5/PRE-7):
 * - MANDATORY PRONOUN: "bạn" (NEVER "con", NEVER "em").
 * - Four-part pedagogical structure:
 *   1. Thái độ và tinh thần học tập trên lớp
 *   2. Điểm mạnh về kiến thức / kỹ năng
 *   3. Điểm hạn chế hoặc khó khăn cụ thể
 *   4. Hướng cải thiện thiết thực
 */
export function generateSmartQuickComment(student: StudentData): string {
  const score = student.score !== '' ? Number(student.score) : null;

  // Categorize evaluated traits
  const attitudeStrengths: string[] = [];
  const attitudeWeaknesses: string[] = [];
  const skillStrengths: string[] = [];
  const skillWeaknesses: string[] = [];

  EVALUATION_GROUPS.forEach((group) => {
    const isAttitudeOrPart =
      group.id === '01-attitude' || group.id === '02-participation';

    group.items.forEach((item) => {
      const lvl = student.evaluations[item.id];
      const traitName = item.nameVi.toLowerCase();

      if (lvl === 5) {
        if (isAttitudeOrPart) attitudeStrengths.push(`${traitName} rất tốt`);
        else skillStrengths.push(`khả năng ${traitName} rất tốt`);
      } else if (lvl === 4) {
        if (isAttitudeOrPart) attitudeStrengths.push(`${traitName} tốt`);
        else skillStrengths.push(`nắm vững ${traitName}`);
      } else if (lvl === 2) {
        if (isAttitudeOrPart) attitudeWeaknesses.push(`${traitName} chưa thực sự ổn định`);
        else skillWeaknesses.push(`còn gặp khó khăn ở ${traitName}`);
      } else if (lvl === 1) {
        if (isAttitudeOrPart) attitudeWeaknesses.push(`${traitName} chưa thể hiện được nhiều`);
        else skillWeaknesses.push(`chưa nắm vững ${traitName}`);
      }
    });
  });

  const sentences: string[] = [];

  // 1. Thái độ và tinh thần học tập trên lớp
  if (attitudeStrengths.length > 0) {
    const attText = attitudeStrengths.slice(0, 2).join(' và ');
    sentences.push(
      `Trong suốt quá trình học tập trên lớp, bạn luôn thể hiện tinh thần học tập nghiêm túc với ${attText}.`
    );
  } else if (attitudeWeaknesses.length > 0) {
    const attWeak = attitudeWeaknesses.slice(0, 2).join(', ');
    sentences.push(
      `Trên lớp, bạn cần chú ý hơn về ${attWeak} để theo kịp tiến độ chung của bài giảng.`
    );
  } else {
    sentences.push(
      `Trong quá trình học tập, bạn duy trì sự tham gia đều đặn và phối hợp cùng giáo viên trên lớp.`
    );
  }

  // 2. Điểm mạnh về kiến thức và kỹ năng + Điểm thi Mock Test
  if (skillStrengths.length > 0) {
    const skillText = skillStrengths.slice(0, 2).join(', ');
    if (score !== null && !isNaN(score)) {
      sentences.push(
        `Điểm nổi bật của bạn nằm ở ${skillText}; kết quả bài thi Mock Test đạt ${score}/100 phản ánh khá rõ nét sự tiếp thu kiến thức của bạn.`
      );
    } else {
      sentences.push(
        `Điểm nổi bật của bạn nằm ở ${skillText}, giúp bạn hoàn thành tốt các bài tập thực hành.`
      );
    }
  } else if (score !== null && !isNaN(score)) {
    if (score >= 70) {
      sentences.push(
        `Kết quả bài thi Mock Test đạt ${score}/100 cho thấy bạn đã nắm khá vững các kiến thức trọng tâm.`
      );
    } else if (score >= 50) {
      sentences.push(
        `Bài thi Mock Test đạt ${score}/100 cho thấy bạn đã hoàn thành ở mức cơ bản, tuy nhiên cần tiếp tục củng cố thêm kiến thức.`
      );
    } else {
      sentences.push(
        `Kết quả bài thi Mock Test đạt ${score}/100 cho thấy bạn còn nhiều phần kiến thức chưa thực sự vững vàng.`
      );
    }
  }

  // 3. Điểm hạn chế hoặc khó khăn cụ thể
  if (skillWeaknesses.length > 0) {
    const weakText = skillWeaknesses.slice(0, 2).join(' cũng như ');
    sentences.push(
      `Tuy nhiên, bạn vẫn ${weakText}, đòi hỏi sự kiên trì luyện tập đều đặn hơn.`
    );
  }

  // 4. Hướng cải thiện & lời khuyến khích sư phạm (Văn phong PRE-5 / PRE-7)
  if (skillWeaknesses.length > 0 || attitudeWeaknesses.length > 0) {
    sentences.push(
      `Thời gian tới, bạn nên chủ động tăng cường luyện tập thêm các dạng bài còn yếu và duy trì việc làm bài tập đầy đủ để có sự bứt phá rõ rệt hơn.`
    );
  } else {
    sentences.push(
      `Nhìn chung, bạn đã có những tiến bộ đáng ghi nhận; thời gian tới bạn nên tiếp tục phát huy các thế mạnh hiện có để đạt kết quả xuất sắc hơn nữa.`
    );
  }

  return sentences.join(' ');
}
