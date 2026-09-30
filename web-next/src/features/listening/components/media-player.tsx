"use client";
import * as React from "react";
import { AlertTriangle, Headphones, Loader2 } from "lucide-react";
import { useT } from "@/i18n/client";
import type { MediaSource } from "@/lib/media-url";

/** Điều khiển chung cho mọi loại trình phát (YouTube nhúng chính thức / thẻ audio-video của trình duyệt). */
export type PlayerApi = {
  play: () => void;
  pause: () => void;
  seek: (sec: number) => void;
  setRate: (rate: number) => void;
  getTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
};

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allowSeekAhead: boolean): void;
  setPlaybackRate(r: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytLoading: Promise<YTNamespace> | null = null;
/** Nạp YouTube IFrame Player API (chính thức) một lần. */
function loadYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  ytLoading ??= new Promise<YTNamespace>((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      ytLoading = null;
      reject(new Error("yt-load"));
    };
    document.head.appendChild(s);
  });
  return ytLoading;
}

export function MediaPlayer({
  source,
  onReady,
  onPlayingChange,
}: {
  source: MediaSource | null;
  onReady: (api: PlayerApi | null) => void;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const t = useT();
  type Status = "loading" | "ready" | "error";
  // Trạng thái gắn với từng nguồn: đổi link → tự về "loading" mà không cần setState trong effect.
  const [st, setSt] = React.useState<{ key: string; status: Status }>({ key: "", status: "loading" });
  const readyRef = React.useRef(onReady);
  const playRef = React.useRef(onPlayingChange);
  React.useEffect(() => {
    readyRef.current = onReady;
    playRef.current = onPlayingChange;
  });

  const ytHost = React.useRef<HTMLDivElement>(null);
  const mediaRef = React.useRef<HTMLMediaElement | null>(null);
  const key = source
    ? source.kind === "youtube" || source.kind === "tiktok"
      ? `${source.kind}:${source.videoId}`
      : `${source.kind}:${source.url}`
    : "";
  const tiktokRef = React.useRef<HTMLIFrameElement>(null);
  const state: Status | "idle" = !source ? "idle" : st.key === key ? st.status : "loading";
  const setState = (status: Status) => setSt({ key, status });

  // YouTube
  React.useEffect(() => {
    if (source?.kind !== "youtube") return;
    let alive = true;
    let player: YTPlayer | null = null;
    const mark = (status: Status) => setSt({ key, status });
    const mount = document.createElement("div");
    ytHost.current?.replaceChildren(mount);
    loadYouTube()
      .then((YT) => {
        if (!alive) return;
        player = new YT.Player(mount, {
          videoId: source.videoId,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
          events: {
            onReady: () => {
              if (!alive || !player) return;
              const p = player;
              mark("ready");
              readyRef.current({
                play: () => p.playVideo(),
                pause: () => p.pauseVideo(),
                seek: (s) => p.seekTo(s, true),
                setRate: (r) => p.setPlaybackRate(r),
                getTime: () => p.getCurrentTime() || 0,
                getDuration: () => p.getDuration() || 0,
                isPlaying: () => p.getPlayerState() === 1,
              });
            },
            onStateChange: (e) => playRef.current?.(e.data === 1),
            onError: () => alive && mark("error"),
          },
        });
      })
      .catch(() => alive && mark("error"));
    return () => {
      alive = false;
      readyRef.current(null);
      try {
        player?.destroy();
      } catch {
        /* đã huỷ */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // TikTok: trình phát nhúng chính thức (player/v1), điều khiển bằng postMessage; không đổi được tốc độ.
  React.useEffect(() => {
    if (source?.kind !== "tiktok") return;
    let time = 0;
    let dur = 0;
    let playing = false;
    let ready = false;
    const send = (type: string, value?: unknown) =>
      tiktokRef.current?.contentWindow?.postMessage({ "x-tiktok-player": true, type, value }, "https://www.tiktok.com");
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== "https://www.tiktok.com" || !e.data || typeof e.data !== "object") return;
      const d = e.data as { type?: string; value?: unknown };
      if (d.type === "onPlayerReady" && !ready) {
        ready = true;
        setSt({ key, status: "ready" });
        readyRef.current({
          play: () => send("play"),
          pause: () => send("pause"),
          seek: (s) => {
            time = s;
            send("seekTo", s);
          },
          setRate: () => undefined,
          getTime: () => time,
          getDuration: () => dur,
          isPlaying: () => playing,
        });
      } else if (d.type === "onCurrentTime" && d.value && typeof d.value === "object") {
        const v = d.value as { currentTime?: number; duration?: number };
        time = Number(v.currentTime) || 0;
        dur = Number(v.duration) || dur;
      } else if (d.type === "onStateChange") {
        playing = d.value === 1;
        playRef.current?.(playing);
      } else if (d.type === "onError") setSt({ key, status: "error" });
    };
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("message", onMsg);
      readyRef.current(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Audio / video trực tiếp: báo "chưa sẵn sàng" khi đổi / bỏ nguồn.
  React.useEffect(() => {
    if (!source || source.kind === "youtube" || source.kind === "tiktok") return;
    return () => readyRef.current(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const mediaReady = (el: HTMLMediaElement) => {
    setState("ready");
    readyRef.current({
      play: () => void el.play().catch(() => {}),
      pause: () => el.pause(),
      seek: (s) => {
        el.currentTime = s;
      },
      setRate: (r) => {
        el.playbackRate = r;
      },
      getTime: () => el.currentTime || 0,
      getDuration: () => (Number.isFinite(el.duration) ? el.duration : 0),
      isPlaying: () => !el.paused && !el.ended,
    });
  };

  const mediaProps = {
    src:
      source && (source.kind === "audio" || source.kind === "video")
        ? source.url.replace(/#lingyu=audio$/, "")
        : undefined,
    controls: true,
    preload: "metadata" as const,
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) => mediaReady(e.currentTarget),
    onError: () => setState("error"),
    onPlay: () => playRef.current?.(true),
    onPause: () => playRef.current?.(false),
  };

  return (
    <div
      aria-label={t("listening.player.label")}
      role="region"
      className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#0E1F3F] text-white"
    >
      {!source ? (
        <div className="flex flex-col items-center gap-2 px-6 text-center text-[15px] text-white/85">
          <Headphones className="size-10 text-[#8CC8FF]" aria-hidden="true" />
          {t("listening.player.empty")}
        </div>
      ) : source.kind === "youtube" ? (
        <div
          ref={ytHost}
          title={t("listening.player.youtubeTitle")}
          className="absolute inset-0 [&_iframe]:size-full"
        />
      ) : source.kind === "tiktok" ? (
        <iframe
          key={key}
          ref={tiktokRef}
          src={`https://www.tiktok.com/player/v1/${source.videoId}?controls=1&progress_bar=1&play_button=1&volume_control=1&timestamp=1&fullscreen_button=1&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=1`}
          title={t("listening.player.tiktokTitle")}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          className="absolute inset-0 size-full border-0 bg-black"
        />
      ) : source.kind === "video" ? (
        <video
          key={key}
          ref={(el) => {
            mediaRef.current = el;
          }}
          playsInline
          className="absolute inset-0 size-full bg-black"
          {...mediaProps}
        />
      ) : (
        <div className="flex w-full flex-col items-center gap-4 px-5">
          <Headphones className="size-12 text-[#8CC8FF]" aria-hidden="true" />
          <audio
            key={key}
            ref={(el) => {
              mediaRef.current = el;
            }}
            className="w-full max-w-[520px]"
            {...mediaProps}
          />
        </div>
      )}
      {source && state === "loading" && source.kind === "youtube" ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-[#0E1F3F] text-[15px]">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          {t("listening.player.loading")}
        </span>
      ) : null}
      {state === "error" ? (
        <p
          role="alert"
          className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {t("listening.player.loadFailed")}
        </p>
      ) : null}
    </div>
  );
}
