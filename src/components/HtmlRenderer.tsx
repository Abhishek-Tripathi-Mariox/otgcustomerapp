import React, {useMemo} from 'react';
import {View, Text, Image, Linking, StyleSheet} from 'react-native';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {scale} from '../utils/scale';

/**
 * Lightweight HTML renderer for the customer app.
 *
 * Supports a useful subset for CMS pages:
 *   - <h1>, <h2>, <h3>, <h4>
 *   - <p>, <br>
 *   - <strong>/<b>, <em>/<i>, <u>, <s>
 *   - <ul>/<ol>/<li>
 *   - <blockquote>
 *   - <a href>
 *   - <img src> (incl. data: URIs)
 *
 * It is deliberately small — no external dependency, no WebView. For richer
 * content (tables, video, etc.) swap in react-native-render-html later.
 */

type Node =
  | {type: 'text'; text: string}
  | {type: 'element'; tag: string; attrs: Record<string, string>; children: Node[]};

const VOID_TAGS = new Set(['br', 'img', 'hr', 'meta', 'link']);

const decodeEntities = (str: string): string =>
  str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

const parseAttrs = (attrStr: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][\w:-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr))) {
    const key = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[key] = decodeEntities(val);
  }
  return attrs;
};

const parseHtml = (html: string): Node[] => {
  if (!html) return [];
  const tokens: Array<{kind: 'open' | 'close' | 'void' | 'text'; tag?: string; attrs?: Record<string, string>; text?: string}> = [];
  let i = 0;
  const len = html.length;

  while (i < len) {
    if (html[i] === '<') {
      // Skip comments
      if (html.startsWith('<!--', i)) {
        const end = html.indexOf('-->', i + 4);
        i = end === -1 ? len : end + 3;
        continue;
      }
      // closing tag
      if (html[i + 1] === '/') {
        const end = html.indexOf('>', i);
        if (end === -1) {
          i = len;
          break;
        }
        const tag = html.slice(i + 2, end).trim().toLowerCase();
        tokens.push({kind: 'close', tag});
        i = end + 1;
        continue;
      }
      // opening tag
      const end = html.indexOf('>', i);
      if (end === -1) {
        i = len;
        break;
      }
      const raw = html.slice(i + 1, end);
      const selfClosing = raw.endsWith('/');
      const cleaned = selfClosing ? raw.slice(0, -1).trim() : raw.trim();
      const spaceIdx = cleaned.search(/\s/);
      const tag =
        (spaceIdx === -1 ? cleaned : cleaned.slice(0, spaceIdx)).toLowerCase();
      const attrs = parseAttrs(spaceIdx === -1 ? '' : cleaned.slice(spaceIdx + 1));
      if (VOID_TAGS.has(tag) || selfClosing) {
        tokens.push({kind: 'void', tag, attrs});
      } else {
        tokens.push({kind: 'open', tag, attrs});
      }
      i = end + 1;
      continue;
    }
    // text node
    const next = html.indexOf('<', i);
    const text = decodeEntities(html.slice(i, next === -1 ? len : next));
    if (text.length) tokens.push({kind: 'text', text});
    i = next === -1 ? len : next;
  }

  // Build a tree
  const root: Node[] = [];
  const stack: Node[] = [];
  const current = (): Node[] => {
    if (stack.length === 0) return root;
    const top = stack[stack.length - 1] as any;
    return top.children;
  };

  for (const t of tokens) {
    if (t.kind === 'text') {
      current().push({type: 'text', text: t.text!});
    } else if (t.kind === 'void') {
      current().push({type: 'element', tag: t.tag!, attrs: t.attrs || {}, children: []});
    } else if (t.kind === 'open') {
      const node: Node = {type: 'element', tag: t.tag!, attrs: t.attrs || {}, children: []};
      current().push(node);
      stack.push(node);
    } else if (t.kind === 'close') {
      // Pop until matching tag found
      for (let j = stack.length - 1; j >= 0; j--) {
        if ((stack[j] as any).tag === t.tag) {
          stack.splice(j);
          break;
        }
      }
    }
  }
  return root;
};

interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  link?: string;
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: FONTS.bold,
    fontSize: scale(22),
    color: COLORS.textPrimary,
    marginTop: scale(12),
    marginBottom: scale(6),
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: scale(18),
    color: COLORS.textPrimary,
    marginTop: scale(10),
    marginBottom: scale(6),
  },
  h3: {
    fontFamily: FONTS.semiBold,
    fontSize: scale(16),
    color: COLORS.textPrimary,
    marginTop: scale(8),
    marginBottom: scale(4),
  },
  h4: {
    fontFamily: FONTS.semiBold,
    fontSize: scale(14),
    color: COLORS.textPrimary,
    marginTop: scale(8),
    marginBottom: scale(4),
  },
  paragraph: {
    fontFamily: FONTS.regular,
    fontSize: scale(13),
    color: COLORS.textPrimary,
    lineHeight: scale(20),
    marginBottom: scale(8),
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: scale(4),
    paddingLeft: scale(4),
  },
  bulletDot: {
    fontFamily: FONTS.regular,
    fontSize: scale(13),
    color: COLORS.textPrimary,
    marginRight: scale(6),
    lineHeight: scale(20),
  },
  bulletText: {
    fontFamily: FONTS.regular,
    fontSize: scale(13),
    color: COLORS.textPrimary,
    lineHeight: scale(20),
    flex: 1,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: scale(10),
    marginVertical: scale(8),
  },
  image: {
    width: '100%',
    borderRadius: scale(8),
    marginVertical: scale(8),
    backgroundColor: '#f3f4f6',
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  bold: {
    fontFamily: FONTS.bold,
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
});

const collectInline = (
  nodes: Node[],
  style: InlineStyle,
  out: React.ReactNode[],
  keyPrefix: string,
) => {
  nodes.forEach((node, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (node.type === 'text') {
      if (!node.text) return;
      const inlineStyles: any[] = [];
      if (style.bold) inlineStyles.push(styles.bold);
      if (style.italic) inlineStyles.push(styles.italic);
      if (style.underline) inlineStyles.push(styles.underline);
      if (style.strike) inlineStyles.push(styles.strike);
      if (style.link) inlineStyles.push(styles.link);
      out.push(
        <Text
          key={key}
          style={inlineStyles}
          onPress={
            style.link
              ? () => Linking.openURL(style.link!).catch(() => {})
              : undefined
          }>
          {node.text}
        </Text>,
      );
      return;
    }
    const tag = node.tag;
    if (tag === 'br') {
      out.push(<Text key={key}>{'\n'}</Text>);
      return;
    }
    if (tag === 'b' || tag === 'strong') {
      collectInline(node.children, {...style, bold: true}, out, key);
      return;
    }
    if (tag === 'i' || tag === 'em') {
      collectInline(node.children, {...style, italic: true}, out, key);
      return;
    }
    if (tag === 'u') {
      collectInline(node.children, {...style, underline: true}, out, key);
      return;
    }
    if (tag === 's' || tag === 'strike') {
      collectInline(node.children, {...style, strike: true}, out, key);
      return;
    }
    if (tag === 'a') {
      const href = node.attrs.href || '';
      collectInline(node.children, {...style, link: href}, out, key);
      return;
    }
    if (tag === 'span') {
      collectInline(node.children, style, out, key);
      return;
    }
    // Anything else inline-ish: recurse without extra style
    collectInline(node.children, style, out, key);
  });
};

const renderInline = (nodes: Node[], keyPrefix: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  collectInline(nodes, {}, out, keyPrefix);
  return out;
};

const renderNode = (node: Node, key: string): React.ReactNode => {
  if (node.type === 'text') {
    if (!node.text.trim()) return null;
    return (
      <Text key={key} style={styles.paragraph}>
        {node.text}
      </Text>
    );
  }
  const {tag, attrs, children} = node;
  switch (tag) {
    case 'h1':
      return (
        <Text key={key} style={styles.h1}>
          {renderInline(children, key)}
        </Text>
      );
    case 'h2':
      return (
        <Text key={key} style={styles.h2}>
          {renderInline(children, key)}
        </Text>
      );
    case 'h3':
      return (
        <Text key={key} style={styles.h3}>
          {renderInline(children, key)}
        </Text>
      );
    case 'h4':
    case 'h5':
    case 'h6':
      return (
        <Text key={key} style={styles.h4}>
          {renderInline(children, key)}
        </Text>
      );
    case 'p':
    case 'div':
      return (
        <Text key={key} style={styles.paragraph}>
          {renderInline(children, key)}
        </Text>
      );
    case 'br':
      return null;
    case 'img': {
      const src = attrs.src || '';
      if (!src) return null;
      return (
        <Image
          key={key}
          source={{uri: src}}
          style={[
            styles.image,
            {height: scale(200)},
          ]}
          resizeMode="cover"
        />
      );
    }
    case 'ul':
      return (
        <View key={key} style={{marginBottom: scale(6)}}>
          {children
            .filter((c) => c.type === 'element' && (c as any).tag === 'li')
            .map((li, i) => (
              <View key={`${key}-li-${i}`} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  {renderInline((li as any).children, `${key}-li-${i}`)}
                </Text>
              </View>
            ))}
        </View>
      );
    case 'ol':
      return (
        <View key={key} style={{marginBottom: scale(6)}}>
          {children
            .filter((c) => c.type === 'element' && (c as any).tag === 'li')
            .map((li, i) => (
              <View key={`${key}-li-${i}`} style={styles.bullet}>
                <Text style={styles.bulletDot}>{i + 1}.</Text>
                <Text style={styles.bulletText}>
                  {renderInline((li as any).children, `${key}-li-${i}`)}
                </Text>
              </View>
            ))}
        </View>
      );
    case 'blockquote':
      return (
        <View key={key} style={styles.blockquote}>
          {children.map((c, i) => renderNode(c, `${key}-bq-${i}`))}
        </View>
      );
    case 'pre':
    case 'code':
      return (
        <View
          key={key}
          style={{
            backgroundColor: '#f3f4f6',
            borderRadius: scale(6),
            padding: scale(10),
            marginVertical: scale(6),
          }}>
          <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textPrimary}}>
            {renderInline(children, key)}
          </Text>
        </View>
      );
    case 'hr':
      return (
        <View
          key={key}
          style={{
            height: 1,
            backgroundColor: '#e5e7eb',
            marginVertical: scale(10),
          }}
        />
      );
    default:
      // Fallback: render children
      return (
        <View key={key}>
          {children.map((c, i) => renderNode(c, `${key}-${i}`))}
        </View>
      );
  }
};

interface HtmlRendererProps {
  html: string;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({html}) => {
  const tree = useMemo(() => parseHtml(html || ''), [html]);
  return <View>{tree.map((n, i) => renderNode(n, `node-${i}`))}</View>;
};

export default HtmlRenderer;
