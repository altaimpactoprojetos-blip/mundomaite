import { create } from 'zustand';
import type {
  Appearance, FarmPlot, HouseConfig, OwnedVehicle, PlacedObject, Pet, PetSpecies, Photo, Painting, PropertyState, Quest,
  ShopItem, TextureKind, Vec3, WorldTask, VehicleType,
} from '../types';
import { DEFAULT_APPEARANCE, isMobile } from './defaults';
import { PROPERTIES } from '../data/world';
import { questsFor, todayKey, STICKERS } from '../data/quests';
import { PETS } from '../data/pets';
import { VEHICLES } from '../data/vehicles';
import { sfx } from '../systems/audio';
import { TOUR } from '../data/tour';
import { starterRoom, type HotelRoom } from '../hotel/rooms';

export type PanelId =
  | 'character' | 'shop' | 'house' | 'build' | 'vehicles' | 'pets' | 'map' | 'settings' | 'bag' | 'jobs'
  | 'photos' | 'quests' | 'social' | 'help';

export type Quality = 'baixa' | 'media' | 'alta';

export interface Settings {
  music: number;
  sfx: number;
  quality: Quality;
  timeSpeed: number;
  fixedDay: boolean;
  minimap: boolean;
  camSens: number;
  camMode: 'habbo' | 'livre';
  pixel: boolean;
}

export interface Parental {
  pin: string | null;
  dailyLimit: number; // minutos (0 = sem limite)
  playedToday: number; // segundos
  playedDate: string;
  creativeLocked: boolean;
}

export interface BuildState {
  item: string | null;
  selected: string | null;
  level: number;
  snap: boolean;
  color: string | null;
  texture: TextureKind;
  rot: number;
}

export interface SaveData {
  appearance: Appearance;
  money: number;
  creative: boolean;
  wardrobe: string[];
  toys: string[];
  held: string | null;
  inventory: Record<string, number>;
  specials: string[];
  properties: Record<string, PropertyState>;
  homeId: string | null;
  placed: PlacedObject[];
  vehicles: OwnedVehicle[];
  pets: Pet[];
  activePet: string | null;
  friendship: Record<string, number>;
  photos: Photo[];
  paintings: Painting[];
  stickers: string[];
  quests: { date: string; list: Quest[] };
  lastGift: string;
  farm: Record<string, FarmPlot>;
  discovered: string[];
  treasures: string[];
  stats: Record<string, number>;
  mall: { stores: string[]; lastCollect: number };
  settings: Settings;
  parental: Parental;
  playerPos: Vec3;
  hour: number;
  version: number;
  tour: { step: number; home: string; done: boolean } | null;
  tourDone: number;
  houseLights: Record<string, boolean>;
  schoolBoard: string | null;
  mode: 'hotel' | 'mundo';
  hotelRooms: HotelRoom[];
  hotelLast: string;
}

interface Transient {
  loaded: boolean;
  screen: 'title' | 'game';
  panel: PanelId | null;
  panelArg: string | null;
  buildMode: boolean;
  build: BuildState;
  toasts: { id: number; text: string; icon: string }[];
  dialog: { npcId: string; text: string; icon?: string } | null;
  minigame: string | null; // id da profissão
  overlay: null | { kind: 'cinema' | 'tv' | 'sleep' | 'gift' | 'rest' | 'piano' | 'pin' | 'prepare' | 'board'; data?: string };
  task: WorldTask | null;
  pinOk: boolean;
  photoFlash: number;
  petMenu: string | null;
}

interface Actions {
  set: (p: Partial<GameState>) => void;
  hydrate: (d: Partial<SaveData>) => void;
  openPanel: (p: PanelId | null, arg?: string | null) => void;
  toast: (text: string, icon?: string) => void;
  spend: (amount: number) => boolean;
  earn: (amount: number, why?: string) => void;
  buy: (item: ShopItem) => boolean;
  owns: (item: ShopItem) => boolean;
  setAppearance: (p: Partial<Appearance>) => void;
  hold: (toy: string | null) => void;
  // construção
  setBuild: (p: Partial<BuildState>) => void;
  addPlaced: (o: Omit<PlacedObject, 'id'>) => string | null;
  updatePlaced: (id: string, p: Partial<PlacedObject>) => void;
  removePlaced: (id: string) => void;
  // casas
  buyProperty: (id: string) => boolean;
  updateHouse: (id: string, p: Partial<HouseConfig>) => void;
  setHome: (id: string) => void;
  // veículos
  addVehicle: (vt: VehicleType, color: string) => OwnedVehicle;
  updateVehicle: (id: string, p: Partial<OwnedVehicle>) => void;
  // pets
  adoptPet: (sp: PetSpecies, color?: string) => Pet;
  updatePet: (id: string, p: Partial<Pet>) => void;
  petCare: (id: string, kind: 'food' | 'play' | 'bath' | 'pet') => void;
  // social / progresso
  befriend: (npcId: string, n?: number) => void;
  track: (event: string, n?: number) => void;
  claimQuest: (id: string) => void;
  addPhoto: (url: string, place: string) => void;
  addPainting: (url: string) => void;
  discover: (place: string) => void;
  setSettings: (p: Partial<Settings>) => void;
  setParental: (p: Partial<Parental>) => void;
  setTask: (t: WorldTask | null) => void;
  completeTarget: (id: string) => void;
  farmAction: (plot: string) => void;
  resetAll: () => void;
  tourEvent: (ev: string) => void;
}

export type GameState = SaveData & Transient & Actions;

const mobile = isMobile();

export const initialSave = (): SaveData => ({
  appearance: { ...DEFAULT_APPEARANCE },
  money: 1000,
  creative: true,
  wardrobe: [],
  toys: ['t-balao', 't-bola'],
  held: null,
  inventory: {},
  specials: [],
  properties: {},
  homeId: null,
  placed: [],
  vehicles: [],
  pets: [],
  activePet: null,
  friendship: {},
  photos: [],
  paintings: [],
  stickers: [],
  quests: { date: todayKey(), list: questsFor(todayKey()) },
  lastGift: '',
  farm: {},
  discovered: [],
  treasures: [],
  stats: {},
  mall: { stores: ['roupas', 'brinquedos', 'sorvete', 'livros'], lastCollect: Date.now() },
  settings: { music: 0.35, sfx: 0.7, quality: mobile ? 'baixa' : 'media', timeSpeed: 1, fixedDay: false, minimap: true, camSens: 1, camMode: 'livre', pixel: false },
  parental: { pin: null, dailyLimit: 0, playedToday: 0, playedDate: todayKey(), creativeLocked: false },
  playerPos: [65, 0, 30],
  hour: 9,
  version: 1,
  tour: null,
  tourDone: 0,
  houseLights: {},
  schoolBoard: null,
  mode: 'hotel',
  hotelRooms: [starterRoom()],
  hotelLast: 'quarto-maite',
});

export const SAVE_KEYS = Object.keys(initialSave()) as (keyof SaveData)[];

let toastId = 0;
const uid = () => Math.random().toString(36).slice(2, 9);

export const useGame = create<GameState>()((set, get) => ({
  ...initialSave(),
  loaded: false,
  screen: 'title',
  panel: null,
  panelArg: null,
  buildMode: false,
  build: { item: null, selected: null, level: 0, snap: true, color: null, texture: 'liso', rot: 0 },
  toasts: [],
  dialog: null,
  minigame: null,
  overlay: null,
  task: null,
  pinOk: false,
  photoFlash: 0,
  petMenu: null,

  set: (p) => set(p),
  hydrate: (d) => {
    const base = initialSave();
    const merged: SaveData = {
      ...base,
      ...d,
      appearance: { ...base.appearance, ...(d.appearance ?? {}) },
      settings: { ...base.settings, ...(d.settings ?? {}) },
      parental: { ...base.parental, ...(d.parental ?? {}) },
    };
    if (merged.quests.date !== todayKey()) merged.quests = { date: todayKey(), list: questsFor(todayKey()) };
    if (merged.parental.playedDate !== todayKey()) merged.parental = { ...merged.parental, playedDate: todayKey(), playedToday: 0 };
    set({ ...merged, loaded: true });
  },
  openPanel: (p, arg = null) => {
    sfx('click');
    set({ panel: p, panelArg: arg, buildMode: p === 'build' ? true : p === null ? get().buildMode : false });
  },
  toast: (text, icon = '✨') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, icon }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  spend: (amount) => {
    const s = get();
    if (s.creative || amount <= 0) return true;
    if (s.money < amount) {
      s.toast('Moedinhas insuficientes! Trabalhe em uma profissão para ganhar mais 🪙', '🪙');
      sfx('error');
      return false;
    }
    set({ money: s.money - amount });
    return true;
  },
  earn: (amount, why) => {
    if (amount <= 0) return;
    set((s) => ({ money: s.money + amount }));
    sfx('coin');
    get().toast(`+${amount} moedinhas${why ? ' — ' + why : ''}`, '🪙');
  },
  owns: (item) => {
    const s = get();
    const d = item.data;
    if (d.kind === 'wear') return s.creative || s.wardrobe.includes(item.id);
    if (d.kind === 'toy') return s.toys.includes(item.id);
    return false;
  },
  buy: (item) => {
    const s = get();
    if (!s.spend(item.price)) return false;
    const d = item.data;
    switch (d.kind) {
      case 'wear':
        if (!s.wardrobe.includes(item.id)) set({ wardrobe: [...s.wardrobe, item.id] });
        s.toast(`${item.name} foi para o seu guarda-roupa!`, item.icon);
        break;
      case 'toy':
        if (!s.toys.includes(item.id)) set({ toys: [...s.toys, item.id] });
        set({ held: d.toy });
        s.toast(`Você ganhou: ${item.name}!`, item.icon);
        break;
      case 'build':
        set({ inventory: { ...s.inventory, [d.model]: (s.inventory[d.model] ?? 0) + 1 } });
        s.toast(`${item.name} está na sua mochila de construção!`, item.icon);
        break;
      case 'vehicle': {
        get().addVehicle(d.vtype, d.color);
        s.toast(`${item.name} está na sua garagem! Abra 🚗 Veículos para chamar.`, item.icon);
        break;
      }
      case 'pet': {
        const p = get().adoptPet(d.species, d.color);
        s.toast(`Você adotou ${p.name}! 💕`, item.icon);
        break;
      }
      case 'special':
        set({ specials: [...s.specials, item.id] });
        break;
    }
    sfx('buy');
    get().track('shop');
    return true;
  },
  setAppearance: (p) => set((s) => ({ appearance: { ...s.appearance, ...p } })),
  hold: (toy) => set({ held: toy }),

  setBuild: (p) => set((s) => ({ build: { ...s.build, ...p } })),
  addPlaced: (o) => {
    const id = uid();
    set((s) => ({ placed: [...s.placed, { ...o, id }] }));
    get().track('build');
    sfx('pop');
    return id;
  },
  updatePlaced: (id, p) => set((s) => ({ placed: s.placed.map((o) => (o.id === id ? { ...o, ...p } : o)) })),
  removePlaced: (id) => {
    const s = get();
    const o = s.placed.find((x) => x.id === id);
    if (o && !s.creative) set({ inventory: { ...s.inventory, [o.model]: (s.inventory[o.model] ?? 0) + 1 } });
    set({ placed: s.placed.filter((x) => x.id !== id), build: { ...s.build, selected: null } });
    sfx('pop');
  },

  buyProperty: (id) => {
    const def = PROPERTIES.find((p) => p.id === id);
    if (!def) return false;
    const s = get();
    if (s.properties[id]?.owned) return true;
    if (!s.spend(def.price)) return false;
    set({ properties: { ...s.properties, [id]: { owned: true, house: def.preset ? { ...def.preset } : null } }, homeId: s.homeId ?? id });
    sfx('fanfare');
    s.toast(def.preset ? `Parabéns! ${def.name} agora é sua! 🏡` : 'Terreno comprado! Construa a casa dos seus sonhos! 🧱', '🔑');
    return true;
  },
  updateHouse: (id, p) =>
    set((s) => {
      const cur = s.properties[id];
      if (!cur) return {};
      const base: HouseConfig = cur.house ?? {
        style: 'casa', name: 'Minha Casa', rooms: 2, depth: 10, floors: 1, wallColor: '#ffd6e8', roofColor: '#e06c75',
        floorColor: '#e8d5b7', pool: false, garden: true, garage: false, furnished: true,
      };
      return { properties: { ...s.properties, [id]: { ...cur, house: { ...base, ...p } } } };
    }),
  setHome: (id) => set({ homeId: id }),

  addVehicle: (vt, color) => {
    const v: OwnedVehicle = { id: uid(), vtype: vt, name: VEHICLES[vt].name, color, color2: '#ffffff', parked: null };
    set((s) => ({ vehicles: [...s.vehicles, v] }));
    return v;
  },
  updateVehicle: (id, p) => set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...p } : v)) })),

  adoptPet: (sp, color) => {
    const names: Record<string, string[]> = {
      cachorro: ['Bolinha', 'Pipoca', 'Thor', 'Mel'], gato: ['Miau', 'Luna', 'Nina', 'Frajola'], coelho: ['Floquinho', 'Cenourinha'],
      cavalo: ['Estrela', 'Trovão'], passaro: ['Piu', 'Kiwi'], hamster: ['Bolotinha', 'Amendoim'], tartaruga: ['Lentinha', 'Casquinha'],
      pinguim: ['Gelinho'], unicornio: ['Arco-Íris', 'Purpurina'], dragao: ['Faísca', 'Brasinha'], raposa: ['Cristal', 'Diamante'], panda: ['Algodão', 'Nuvenzinha'],
    };
    const list = names[sp] ?? ['Amiguinho'];
    const p: Pet = {
      id: uid(), species: sp, name: list[Math.floor(Math.random() * list.length)], color: color ?? PETS[sp].colors[0],
      accessory: 'laco', accColor: '#ff5fa2', hunger: 80, fun: 80, clean: 90, love: 20,
    };
    set((s) => ({ pets: [...s.pets, p], activePet: s.activePet ?? p.id }));
    return p;
  },
  updatePet: (id, p) => set((s) => ({ pets: s.pets.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
  petCare: (id, kind) => {
    const pet = get().pets.find((p) => p.id === id);
    if (!pet) return;
    const c = (v: number) => Math.max(0, Math.min(100, v));
    const up: Partial<Pet> = { love: c(pet.love + 5) };
    if (kind === 'food') up.hunger = c(pet.hunger + 40);
    if (kind === 'play') { up.fun = c(pet.fun + 35); up.hunger = c(pet.hunger - 5); up.clean = c(pet.clean - 8); }
    if (kind === 'bath') up.clean = 100;
    if (kind === 'pet') up.fun = c(pet.fun + 10);
    get().updatePet(id, up);
    get().track('pet');
  },

  befriend: (npcId, n = 1) => set((s) => ({ friendship: { ...s.friendship, [npcId]: Math.min(10, (s.friendship[npcId] ?? 0) + n) } })),
  track: (event, n = 1) => {
    const s = get();
    const stats = { ...s.stats, [event]: (s.stats[event] ?? 0) + n };
    let changed = false;
    const list = s.quests.list.map((q) => {
      if (q.event !== event || q.progress >= q.target) return q;
      changed = true;
      const progress = Math.min(q.target, q.progress + n);
      if (progress >= q.target) setTimeout(() => get().toast(`Missão completa: ${q.text}! Abra ⭐ Missões para pegar o prêmio`, '🏅'), 300);
      return { ...q, progress };
    });
    set(changed ? { stats, quests: { ...s.quests, list } } : { stats });
  },
  claimQuest: (id) => {
    const s = get();
    const q = s.quests.list.find((x) => x.id === id);
    if (!q || q.claimed || q.progress < q.target) return;
    set({ quests: { ...s.quests, list: s.quests.list.map((x) => (x.id === id ? { ...x, claimed: true } : x)) } });
    const sticker = STICKERS.find((st) => !s.stickers.includes(st));
    if (sticker) set({ stickers: [...get().stickers, sticker] });
    get().earn(q.reward, 'missão');
    sfx('fanfare');
    if (sticker) get().toast(`Novo adesivo: ${sticker}`, sticker);
  },
  addPhoto: (url, place) => {
    set((s) => ({ photos: [{ id: uid(), url, date: Date.now(), place }, ...s.photos].slice(0, 40), photoFlash: Date.now() }));
    get().track('photo');
  },
  addPainting: (url) => set((s) => ({ paintings: [{ id: uid(), url, date: Date.now() }, ...s.paintings].slice(0, 30) })),
  discover: (place) => {
    const s = get();
    if (s.discovered.includes(place)) return;
    set({ discovered: [...s.discovered, place] });
    s.toast(`Lugar descoberto: ${place}!`, '🗺️');
    s.track('visit');
    sfx('sparkle');
  },
  setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
  setParental: (p) => set((s) => ({ parental: { ...s.parental, ...p } })),
  setTask: (t) => set({ task: t }),
  completeTarget: (id) => {
    const t = get().task;
    if (!t) return;
    const targets = t.targets.map((x) => (x.id === id ? { ...x, done: true } : x));
    sfx('sparkle');
    if (targets.every((x) => x.done)) {
      set({ task: null });
      get().earn(t.reward, t.title);
      get().track('job');
      sfx('fanfare');
      get().toast('Trabalho concluído! Você é incrível! 🌟', '🏆');
    } else {
      set({ task: { ...t, targets } });
      get().toast(`Faltam ${targets.filter((x) => !x.done).length}!`, '✅');
    }
  },
  farmAction: (plotId) => {
    const s = get();
    const plot = s.farm[plotId];
    const crops = ['cenoura', 'morango', 'abobora', 'girassol', 'milho', 'alface'];
    if (!plot || !plot.crop) {
      const crop = crops[Math.floor(Math.random() * crops.length)];
      set({ farm: { ...s.farm, [plotId]: { crop, planted: Date.now(), watered: false } } });
      s.toast('Sementinha plantada! Regue para crescer mais rápido 💧', '🌱');
      sfx('pop');
      return;
    }
    const grow = (Date.now() - plot.planted) / 1000 / (plot.watered ? 30 : 60);
    if (grow < 1 && !plot.watered) {
      set({ farm: { ...s.farm, [plotId]: { ...plot, watered: true } } });
      s.toast('Plantinha regada! 💧', '💧');
      sfx('splash');
      return;
    }
    if (grow < 1) {
      s.toast('Ainda está crescendo... volte daqui a pouquinho! 🌱', '⏳');
      return;
    }
    set({ farm: { ...s.farm, [plotId]: { crop: null, planted: 0, watered: false } } });
    get().earn(15, 'colheita');
    get().track('harvest');
  },
  resetAll: () => set({ ...initialSave(), screen: 'title', panel: null }),
  tourEvent: (ev) => {
    const s = get();
    const t = s.tour;
    if (!t || t.done) return;
    const step = TOUR[t.step];
    if (!step || step.ev !== ev) return;
    const next = t.step + 1;
    sfx('fanfare');
    if (next >= TOUR.length) {
      set({ tour: { ...t, step: next, done: true }, tourDone: s.tourDone + 1 });
      s.earn(300, 'passeio completo');
      const sticker = STICKERS.find((st) => !get().stickers.includes(st));
      if (sticker) set({ stickers: [...get().stickers, sticker] });
      s.toast('🎉 Passeio com Purpurina completo! A foto está no seu Álbum 📸', '🦄');
      return;
    }
    set({ tour: { ...t, step: next } });
    s.toast(`✅ ${step.title}! Agora: ${TOUR[next].title}`, TOUR[next].icon);
  },
}));

export const pickSave = (s: GameState): SaveData => {
  const o: Record<string, unknown> = {};
  for (const k of SAVE_KEYS) o[k] = s[k];
  return o as unknown as SaveData;
};
