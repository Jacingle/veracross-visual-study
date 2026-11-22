import type { ReactNode } from "react";

/** Veracross-style notice page: grey page, dark title bar, white message box. Used for 404s, errors and access restrictions. */
export function ErrorPage({ title, message, detail, fullPage = true, children }: { title: string; message: string; detail?: string; fullPage?: boolean; children?: ReactNode }) {
  return (
    <div className={`bg-[#d4d4d4] px-4 pt-[22px] pb-10 font-[Helvetica,Arial,sans-serif] ${fullPage ? "min-h-screen" : ""}`}>
      <div className="mx-auto w-full max-w-[540px] bg-[#cdcdcd] p-[7px]">
        <div className="flex h-[51px] items-center justify-center bg-[#333] text-[20px] leading-none text-white">{title}</div>
        <div className="bg-white px-6 pb-[28px] pt-[16px] text-center">
          <h1 className="text-[16px] font-bold leading-[24px] text-black">{message}</h1>
          <p className="mt-[14px] text-[11.5px] font-bold leading-[16px] text-[#999]">{detail ?? "Please contact your support representative if you need to get in touch."}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
