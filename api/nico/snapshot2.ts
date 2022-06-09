import { NowRequest, NowResponse } from "@vercel/node";
import axios from "axios";
import { JSDOM } from "jsdom";

/**
 * ニコニコ動画
 * 
 * 使用例:
 *    endpoint/api/nico-snapshot2?query
 *
 * @param req HTTP request
 * @param res HTTP responce
 */
export default async function (req: NowRequest, res: NowResponse) {
  const searchquery = getUrlParameter(req);
  if (!searchquery) {
    errorResponce(res);
    return;
  }

  try {
    const requesturl: string = 'https://api.search.nicovideo.jp/api/v2/snapshot/video/contents/search' + searchquery;

    const responce = await axios.get(requesturl);
    const data = responce.data;
    res.status(200).json(data);
  } catch (e) {
    errorResponce(res);
  }
}

function isValidUrlParameter(url: string | string[]): boolean {
  return !(url == undefined || url == null || Array.isArray(url));
}

function getUrlParameter(req: NowRequest): string | null {
  let query = req.url;
  query = query.slice(19);
  if (isValidUrlParameter(query)) {
    return <string>query;
  }
  return null;
}

function errorResponce(res: NowResponse): void {
  res.status(400).send("error");
}
