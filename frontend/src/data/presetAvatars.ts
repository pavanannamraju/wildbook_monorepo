import giraffeUrl from "../assets/avatar_icons/002-giraffe.svg";
import monkeyUrl from "../assets/avatar_icons/003-monkey.svg";
import rabbitUrl from "../assets/avatar_icons/004-rabbit.svg";
import pandaBearUrl from "../assets/avatar_icons/007-panda bear.svg";
import cheetahUrl from "../assets/avatar_icons/008-cheetah.svg";
import deerUrl from "../assets/avatar_icons/011-deer.svg";
import wolfUrl from "../assets/avatar_icons/014-wolf.svg";
import foxUrl from "../assets/avatar_icons/015-fox.svg";
import tigerUrl from "../assets/avatar_icons/019-tiger.svg";
import zebraUrl from "../assets/avatar_icons/020-zebra.svg";
import bearUrl from "../assets/avatar_icons/025-bear.svg";
import rhinocerosUrl from "../assets/avatar_icons/030-rhinoceros.svg";
import elephantUrl from "../assets/avatar_icons/034-elephant.svg";
import gorillaUrl from "../assets/avatar_icons/042-gorilla.svg";
import kangarooUrl from "../assets/avatar_icons/043-kangaroo.svg";
import polarBearUrl from "../assets/avatar_icons/044-polar bear.svg";
import owlUrl from "../assets/avatar_icons/045-owl.svg";
import beaverUrl from "../assets/avatar_icons/046-beaver.svg";
import squirrelUrl from "../assets/avatar_icons/048-squirrel.svg";
import koalaUrl from "../assets/avatar_icons/050-koala.svg";

export type AvatarType = "preset" | "custom";

export type PresetAvatar = {
  /** Stable id stored in MongoDB when avatar_type is "preset". */
  key: string;
  label: string;
  src: string;
};

/**
 * Preset wildlife avatars. `key` is what we persist on the user document
 * (avatar_type="preset", avatar_key=<key>).
 */
export const PRESET_AVATARS: readonly PresetAvatar[] = [
  { key: "002-giraffe", label: "Giraffe", src: giraffeUrl },
  { key: "003-monkey", label: "Monkey", src: monkeyUrl },
  { key: "004-rabbit", label: "Rabbit", src: rabbitUrl },
  { key: "007-panda-bear", label: "Panda", src: pandaBearUrl },
  { key: "008-cheetah", label: "Cheetah", src: cheetahUrl },
  { key: "011-deer", label: "Deer", src: deerUrl },
  { key: "014-wolf", label: "Wolf", src: wolfUrl },
  { key: "015-fox", label: "Fox", src: foxUrl },
  { key: "019-tiger", label: "Tiger", src: tigerUrl },
  { key: "020-zebra", label: "Zebra", src: zebraUrl },
  { key: "025-bear", label: "Bear", src: bearUrl },
  { key: "030-rhinoceros", label: "Rhinoceros", src: rhinocerosUrl },
  { key: "034-elephant", label: "Elephant", src: elephantUrl },
  { key: "042-gorilla", label: "Gorilla", src: gorillaUrl },
  { key: "043-kangaroo", label: "Kangaroo", src: kangarooUrl },
  { key: "044-polar-bear", label: "Polar bear", src: polarBearUrl },
  { key: "045-owl", label: "Owl", src: owlUrl },
  { key: "046-beaver", label: "Beaver", src: beaverUrl },
  { key: "048-squirrel", label: "Squirrel", src: squirrelUrl },
  { key: "050-koala", label: "Koala", src: koalaUrl },
] as const;

export const PRESET_AVATAR_KEYS = new Set(PRESET_AVATARS.map((avatar) => avatar.key));

export function resolvePresetAvatarSrc(key: string | null | undefined): string | null {
  if (!key) return null;
  return PRESET_AVATARS.find((avatar) => avatar.key === key)?.src ?? null;
}

export function resolveUserAvatarSrc(options: {
  avatarType: AvatarType | null | undefined;
  avatarKey: string | null | undefined;
  avatarUrl: string | null | undefined;
}): string | null {
  if (options.avatarType === "custom" && options.avatarUrl) {
    return options.avatarUrl;
  }
  if (options.avatarType === "preset") {
    return resolvePresetAvatarSrc(options.avatarKey);
  }
  return resolvePresetAvatarSrc(options.avatarKey) ?? options.avatarUrl ?? null;
}
