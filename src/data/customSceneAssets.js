const asset = (name) => `/assets/${name}`;

export const customSceneAssets = [
  {
    id: "vincent-war-room",
    speaker: "Vincent 梁志诚",
    relation: "带教经理",
    channel: "会议",
    image: asset("custom-vincent-war-room-v01.png"),
  },
  {
    id: "mrs-ho-manager-office",
    speaker: "何太",
    relation: "上司",
    channel: "当面",
    image: asset("custom-mrs-ho-manager-office-v01.png"),
  },
  {
    id: "chen-client-boardroom",
    speaker: "陈嘉敏",
    relation: "客户",
    channel: "会议",
    image: asset("custom-chen-client-boardroom-v01.png"),
  },
  {
    id: "ah-long-open-office",
    speaker: "阿朗",
    relation: "跨部门伙伴",
    channel: "当面",
    image: asset("custom-ah-long-open-office-v01.png"),
  },
  {
    id: "chen-video-call",
    speaker: "陈嘉敏",
    relation: "客户",
    channel: "视频会议",
    image: asset("custom-chen-video-call-v01.png"),
  },
  {
    id: "mrs-ho-restaurant",
    speaker: "何太",
    relation: "上司",
    channel: "非正式会面",
    image: asset("custom-mrs-ho-restaurant-v01.png"),
  },
];

export const customSceneImages = customSceneAssets.map((scene) => scene.image);

export function getCustomSceneImage(id) {
  return customSceneAssets.find((scene) => scene.id === id)?.image;
}
