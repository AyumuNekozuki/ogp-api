import { NowRequest, NowResponse } from "@vercel/node";
import axios from "axios";
import { JSDOM } from "jsdom";

/**
 * OGPタグを取得して、そのcontentをJSON形式で返す.
 * 使用例:
 *    endpoint/api/ogp?url="サイトのURL"
 *
 * @param req HTTP request
 * @param res HTTP responce
 */
export default async function (req: NowRequest, res: NowResponse) {
  const url = getUrlParameter(req);
  if (!url) {
    errorResponce(res);
    return;
  }

  try {
    const responce = await axios.get(<string>url);
    const data = responce.data;
    const dom = new JSDOM(data);
    const meta = dom.window.document.querySelectorAll("html");

    // metaからOGPを抽出し、JSON形式に変換する
    res.status(200).json(meta);
  } catch (e) {
    errorResponce(res);
  }
}

function isValidUrlParameter(url: string | string[]): boolean {
  return !(url == undefined || url == null || Array.isArray(url));
}

function getUrlParameter(req: NowRequest): string | null {
  const { url } = req.query;
  if (isValidUrlParameter(url)) {
    return <string>url;
  }
  return null;
}

function errorResponce(res: NowResponse): void {
  res.status(400).send("error");
}
