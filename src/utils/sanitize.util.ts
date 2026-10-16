import * as sanitizeHtml from 'sanitize-html';

export const sanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [
      "b", "i", "em", "strong", "a", "p", "br",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "u", "s", "strike", "del", 
      "sup", "sub", "mark", "span", "blockquote", "hr"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      '*': ["style"],
    },
    allowedStyles: {
      '*': {
        // Match HEX and RGB
        'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
        'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        'font-size': [/^(12|14|16|18|20|24|28|32)px$/],
        'font-family': [/^(Arial|Georgia|Verdana|Outfit)$/i],
      }
    }
};

export function sanitizeHtmlField(fieldValue: any): any {
    if (!fieldValue) return fieldValue;

    if (typeof fieldValue === 'string') {
        return sanitizeHtml(fieldValue, sanitizeOptions);
    }

    if (Array.isArray(fieldValue)) {
        return fieldValue.map((value) => sanitizeHtmlField(value));
    }
    
    if (typeof fieldValue === 'object') {
        const sanitizedObj: any = {};
        for (const key in fieldValue) {
            if (Object.prototype.hasOwnProperty.call(fieldValue, key)) {
                sanitizedObj[key] = sanitizeHtmlField(fieldValue[key]);
            }
        }
        return sanitizedObj;
    }
    
    return fieldValue;
}
