export const knowledgeSources = [
  {
    id: "hk-labour-effective-workplace-communication",
    title: "《职场·有效沟通》",
    publisher: "香港劳工处",
    url: "https://www.labour.gov.hk/chs/public/pdf/wcp/Effective_Workplace_Communication_chs.pdf",
    usageNote: "用于提炼清晰表达、双向沟通和关系维护原则。",
    riskLevel: "low",
  },
  {
    id: "hk-labour-communication-consultation",
    title: "劳资沟通与协商",
    publisher: "香港劳工处",
    url: "https://www.labour.gov.hk/tc/public/pdf/Establish_Effective_Communication_and_Consultation_between_Employers_and_Employees_tc.pdf",
    usageNote: "用于客观清晰、坦诚沟通和协商训练。",
    riskLevel: "low",
  },
  {
    id: "hk-labour-good-hr-guide",
    title: "良好人事管理指引",
    publisher: "香港劳工处",
    url: "https://www.labour.gov.hk/chs/public/gpm_1.htm",
    usageNote: "用于一般管理沟通，不解释具体雇佣权利。",
    riskLevel: "medium",
  },
  {
    id: "hk-eoc-conciliated-cases",
    title: "和解个案资料库",
    publisher: "香港平等机会委员会",
    url: "https://www.eoc.org.hk/zh-cn/CaseBook",
    usageNote: "属于调停个案，并非法庭裁决；只用于匿名沟通训练。",
    riskLevel: "high",
  },
  {
    id: "hk-pcpd-hr-code",
    title: "人力资源管理实务守则",
    publisher: "香港个人资料私隐专员公署",
    url: "https://www.pcpd.org.hk/tc_chi/data_privacy_law/code_of_practices/code.html",
    usageNote: "用于训练数据最小化和升级确认，不作合规结论。",
    riskLevel: "high",
  },
  {
    id: "hk-pcpd-data-breach",
    title: "资料外泄事故的处理及通报指引",
    publisher: "香港个人资料私隐专员公署",
    url: "https://www.pcpd.org.hk/tc_chi/resources_centre/publications/information_leaflet/information_leaflet.html",
    usageNote: "用于及时升级和事实沟通，不提供事故处置意见。",
    riskLevel: "high",
  },
  {
    id: "hk-icac-business-integrity",
    title: "商界：企业诚信管理计划",
    publisher: "香港廉政公署",
    url: "https://www.icac.org.hk/tc/educate-resources/educate/business-sector/index.html",
    usageNote: "用于利益冲突识别和升级沟通，不判断刑事责任。",
    riskLevel: "high",
  },
];

export function getKnowledgeSources(ids = []) {
  const selected = knowledgeSources.filter((source) => ids.includes(source.id));
  return selected.length ? selected : knowledgeSources.slice(0, 2);
}
