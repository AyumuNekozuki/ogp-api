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
  const keyword = req.query.q;
  if (!keyword) {
    errorResponce(res);
    return;
  }

  const url = 'https://seiga.nicovideo.jp/search/' + keyword;

  try {
    const responce = await axios.get(<string>url);
    const data = responce.data;
    const dom = new JSDOM(data);
    const meta = dom.window.document.querySelectorAll(".tab_table strong");

    const resdata = {
      'video': meta[0].textContent,
      'mylist': meta[1].textContent,
      'seiga': meta[2].textContent,
      'live': meta[3].textContent,
    }

    res.status(200).json(resdata);
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
