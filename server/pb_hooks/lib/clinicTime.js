// Data e hora locais da clínica (Bahia: UTC−3, sem horário de verão desde 2019).
// O servidor pode rodar em UTC, por isso "hoje" e "agora" são calculados com o deslocamento fixo,
// no mesmo formato gravado nas coleções: data YYYY-MM-DD e horário HH:MM.
const CLINIC_UTC_OFFSET_MINUTES = -180;

function clinicNow() {
  const local = new Date(Date.now() + CLINIC_UTC_OFFSET_MINUTES * 60 * 1000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

module.exports = { clinicNow };
