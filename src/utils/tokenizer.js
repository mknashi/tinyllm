/**
 * Simple Byte-Pair Encoding (BPE) Tokenizer
 * Optimized for XML/JSON structured data
 */

export class Tokenizer {
  constructor(vocab = null) {
    // Special tokens
    this.PAD_TOKEN = '<pad>';
    this.UNK_TOKEN = '<unk>';
    this.BOS_TOKEN = '<bos>';
    this.EOS_TOKEN = '<eos>';

    // Initialize vocabulary
    if (vocab) {
      this.vocab = vocab;
      this.idToToken = Object.fromEntries(
        Object.entries(vocab).map(([token, id]) => [id, token])
      );
    } else {
      this._initializeDefaultVocab();
    }
  }

  /**
   * Initialize default vocabulary for XML/JSON
   */
  _initializeDefaultVocab() {
    const specialTokens = [
      this.PAD_TOKEN,
      this.UNK_TOKEN,
      this.BOS_TOKEN,
      this.EOS_TOKEN,
    ];

    // Common JSON/XML characters and patterns
    const commonChars = [
      '{', '}', '[', ']', '<', '>', '/', '?', '!', '=',
      '"', "'", ':', ',', '.', ';', ' ', '\n', '\t',
      '&', '#', '(', ')', '-', '_', '+', '*', '@',
    ];

    // Common XML/JSON tokens
    const commonTokens = [
      '<?xml', '?>', '</', '/>', '<!--', '-->',
      'version', 'encoding', 'UTF-8', 'true', 'false', 'null',
      '&lt;', '&gt;', '&amp;', '&quot;', '&apos;',
    ];

    // Letters and digits
    const alphanumeric = [];
    for (let i = 0; i < 26; i++) {
      alphanumeric.push(String.fromCharCode(65 + i)); // A-Z
      alphanumeric.push(String.fromCharCode(97 + i)); // a-z
    }
    for (let i = 0; i < 10; i++) {
      alphanumeric.push(i.toString());
    }

    // Build vocabulary
    const allTokens = [
      ...specialTokens,
      ...commonChars,
      ...alphanumeric,
      ...commonTokens,
    ];

    this.vocab = {};
    this.idToToken = {};

    allTokens.forEach((token, index) => {
      this.vocab[token] = index;
      this.idToToken[index] = token;
    });

    // Add common bigrams and trigrams
    const commonBigrams = ['th', 'he', 'in', 'er', 'an', 'on', 'at', 'en'];
    const commonTrigrams = ['the', 'and', 'ing', 'ion'];

    [...commonBigrams, ...commonTrigrams].forEach(token => {
      if (!(token in this.vocab)) {
        const id = Object.keys(this.vocab).length;
        this.vocab[token] = id;
        this.idToToken[id] = token;
      }
    });
  }

  /**
   * Encode text to token IDs
   */
  encode(text, addSpecialTokens = true) {
    const tokens = this._tokenize(text);
    let ids = tokens.map(token => this.vocab[token] || this.vocab[this.UNK_TOKEN]);

    if (addSpecialTokens) {
      ids = [this.vocab[this.BOS_TOKEN], ...ids, this.vocab[this.EOS_TOKEN]];
    }

    return ids;
  }

  /**
   * Decode token IDs to text
   */
  decode(ids, skipSpecialTokens = true) {
    const specialIds = new Set([
      this.vocab[this.PAD_TOKEN],
      this.vocab[this.BOS_TOKEN],
      this.vocab[this.EOS_TOKEN],
    ]);

    const tokens = ids
      .filter(id => !skipSpecialTokens || !specialIds.has(id))
      .map(id => this.idToToken[id] || this.UNK_TOKEN);

    return this._detokenize(tokens);
  }

  /**
   * Tokenize text into tokens
   */
  _tokenize(text) {
    const tokens = [];
    let i = 0;

    while (i < text.length) {
      let matched = false;

      // Try to match longest token first
      for (let len = Math.min(10, text.length - i); len > 0; len--) {
        const substr = text.substr(i, len);
        if (substr in this.vocab) {
          tokens.push(substr);
          i += len;
          matched = true;
          break;
        }
      }

      // If no match, add character as single token
      if (!matched) {
        const char = text[i];
        tokens.push(char in this.vocab ? char : this.UNK_TOKEN);
        i++;
      }
    }

    return tokens;
  }

  /**
   * Detokenize tokens back to text
   */
  _detokenize(tokens) {
    return tokens.join('');
  }

  /**
   * Get vocabulary size
   */
  get vocabSize() {
    return Object.keys(this.vocab).length;
  }

  /**
   * Save vocabulary to JSON
   */
  toJSON() {
    return {
      vocab: this.vocab,
      special_tokens: {
        pad: this.PAD_TOKEN,
        unk: this.UNK_TOKEN,
        bos: this.BOS_TOKEN,
        eos: this.EOS_TOKEN,
      },
    };
  }

  /**
   * Load vocabulary from JSON
   */
  static fromJSON(json) {
    const tokenizer = new Tokenizer(json.vocab);
    if (json.special_tokens) {
      tokenizer.PAD_TOKEN = json.special_tokens.pad;
      tokenizer.UNK_TOKEN = json.special_tokens.unk;
      tokenizer.BOS_TOKEN = json.special_tokens.bos;
      tokenizer.EOS_TOKEN = json.special_tokens.eos;
    }
    return tokenizer;
  }

  /**
   * Batch encode multiple texts
   */
  batchEncode(texts, addSpecialTokens = true, padToMaxLength = false) {
    const encoded = texts.map(text => this.encode(text, addSpecialTokens));

    if (padToMaxLength) {
      const maxLen = Math.max(...encoded.map(ids => ids.length));
      const padId = this.vocab[this.PAD_TOKEN];

      return encoded.map(ids => {
        const padded = [...ids];
        while (padded.length < maxLen) {
          padded.push(padId);
        }
        return padded;
      });
    }

    return encoded;
  }

  /**
   * Batch decode multiple token ID sequences
   */
  batchDecode(idsList, skipSpecialTokens = true) {
    return idsList.map(ids => this.decode(ids, skipSpecialTokens));
  }
}
