import { Link } from "."
import { AdtHTTP } from "../AdtHTTP"
import {
  fullParse,
  xmlArray,
  xmlNodeAttr,
  xmlNode,
  parseJsonDate
} from "../utilities"

export interface Feed {
  author: string
  href: string
  published: Date
  summary: string
  title: string
  updated: Date
  accept: string
  refresh: FeedRefresh
  paging?: number
  operators: FeedOperator[]
  dataTypes: FeedDataType[]
  attributes: FeedAttribute[]
  queryIsObligatory?: boolean
  queryDepth?: number
  queryVariants: FeedQueryVariant[]
}

export interface FeedDataType {
  id: string
  label: string
  operators: string[]
}

export interface FeedAttribute extends FeedDataType {
  dataType: string
}

export interface FeedOperator {
  id: string
  numberOfOperands: number
  kind: string
  label: string
}

export interface FeedQueryVariant {
  queryString: string
  title: string
  isDefault: boolean
}

export interface FeedRefresh {
  value: number
  unit: string
}

export interface DumpsFeed {
  href: string
  title: string
  updated: Date
  dumps: Dump[]
}

export interface Dump {
  categories: DumpCategory[]
  links: Link[]
  id: string
  author?: string
  title: string
  updated: Date
  text: string
  type: string
}

export interface DumpCategory {
  term: string
  label: "ABAP runtime error" | "Terminated ABAP program"
}

const parseFeeds = (body: string): Feed[] => {
  const raw = fullParse(body, { removeNSPrefix: true })
  const parseDt = (dt: any) => {
    const { "@_id": id, label = "" } = dt
    const operators = xmlArray(dt, "operators", "operator")
    return { id, label, operators: operators.map((o: any) => o["@_id"]) }
  }
  const parseAttribute = (at: any) => {
    const dataType = at.dataType?.["@_id"]
    return { ...parseDt(at), dataType }
  }
  const parseOperators = (op: any) => ({ ...xmlNodeAttr(op), label: op.label })

  const feeds = xmlArray(raw, "feed", "entry").map((f: any) => {
    const author = xmlNode(f, "author", "name")
    const { href, type: accept } = xmlNodeAttr(f["link"])
    const { published, summary, title, updated } = f
    const ed = f.extendedData
    const refresh = xmlNodeAttr(ed?.refresh?.interval)
    const paging = ed?.paging?.["@_size"]
    const { queryIsObligatory, queryDepth } = ed
    const operators = xmlArray(ed, "operators", "operator").map(parseOperators)
    const dataTypes = xmlArray(ed, "dataTypes", "dataType").map(parseDt)
    const attributes = xmlArray(ed, "attributes", "attribute").map(
      parseAttribute
    )
    const queryVariants = xmlArray(ed, "queryVariants", "queryVariant").map(
      xmlNodeAttr
    )
    return {
      author,
      href,
      published: parseJsonDate(published),
      summary,
      title,
      updated: parseJsonDate(updated),
      accept,
      refresh,
      paging,
      operators,
      dataTypes,
      attributes,
      queryIsObligatory,
      queryDepth,
      queryVariants
    }
  })
  return feeds
}

const parseDumps = (body: string): DumpsFeed => {
  const raw = fullParse(body, {
    removeNSPrefix: true,
    // dump 摘要内嵌整段 HTML（转义实体上千属正常内容），默认实体展开上限
    // 1000 恰好卡在典型 dump 体积附近——时好时坏的根源，这里放大预算
    processEntities: { enabled: true, maxTotalExpansions: 1000000 }
  })?.feed
  const { href } = xmlNodeAttr(raw?.link)
  const { title, updated } = raw
  const dumps = xmlArray(raw, "entry").map((e: any) => {
    const category = xmlArray(e, "category").map(xmlNodeAttr)
    const links = xmlArray(e, "link").map(xmlNodeAttr)
    // author/summary 并非每个 entry 必有，缺省解构会抛 TypeError
    const author = e.author?.name
    const { "#text": text = "", "@_type": type = "" } = e.summary ?? {}
    return {
      categories: category,
      links,
      id: e.id,
      author,
      title: e.title,
      updated: parseJsonDate(e.updated),
      text: text,
      type
    }
  })
  return { href, title, updated: parseJsonDate(updated), dumps }
}

export async function feeds(h: AdtHTTP) {
  const headers = { Accept: "application/atom+xml;type=feed" }
  const response = await h.request("/sap/bc/adt/feeds", {
    method: "GET",
    headers
  })
  return parseFeeds(response.body)
}

export async function dumps(h: AdtHTTP, query: string = "") {
  const headers = { Accept: "application/atom+xml;type=feed" }
  // dumps 端点收普通查询参数（maxNumber / from / user...），不认 $query——
  // 调用方给的 "maxNumber=5&from=..." 原样拆开透传，别包进 $query
  const qs: Record<string, string> = {}
  for (const pair of query.replace(/^\?/, "").split("&")) {
    if (!pair) continue
    const eq = pair.indexOf("=")
    if (eq < 0) qs[decodeURIComponent(pair)] = ""
    else
      qs[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(
        pair.slice(eq + 1)
      )
  }
  const response = await h.request("/sap/bc/adt/runtime/dumps", {
    method: "GET",
    qs,
    headers
  })

  return parseDumps(response.body)
}
