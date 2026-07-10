import http.server, json, mimetypes, os, sys, time, uuid

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIR = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.abspath('.')

users_db = {}
sessions_db = {}

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *a):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % a))

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization')

    def _json(self, d, s=200):
        b = json.dumps(d, ensure_ascii=False).encode()
        self.send_response(s); self._cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers(); self.wfile.write(b)

    def _read(self):
        l = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(l)) if l else {}

    def _file(self, p):
        if not os.path.isfile(p): return self.send_error(404)
        c, _ = mimetypes.guess_type(p)
        s = os.path.getsize(p)
        self.send_response(200); self._cors()
        self.send_header('Content-Type', c or 'application/octet-stream')
        self.send_header('Content-Length', str(s))
        self.end_headers()
        with open(p, 'rb') as f: self.wfile.write(f.read())

    def do_OPTIONS(self):
        self.send_response(200); self._cors(); self.end_headers()

    def do_GET(self):
        if self.path == '/api/auth/me':
            t = self.headers.get('Authorization','').replace('Bearer ','')
            u = sessions_db.get(t)
            if not u: return self._json({'error':'Unauthorized'}, 401)
            return self._json(users_db[u])

        p = self.path.split('?')[0]
        fp = os.path.normpath(os.path.join(DIR, p.lstrip('/')))
        if fp.startswith(DIR) and os.path.isfile(fp): return self._file(fp)
        self._file(os.path.join(DIR, 'index.html'))

    def do_POST(self):
        if self.path == '/api/auth/register':
            b = self._read()
            un = b.get('username',''); pw = b.get('password',''); nn = b.get('nickname',un)
            if len(un) < 3: return self._json({'error':'用户名至少3个字符'},400)
            if len(pw) < 4: return self._json({'error':'密码至少4个字符'},400)
            if un in users_db: return self._json({'error':'用户名已存在'},409)
            uid = str(uuid.uuid4())[:8]
            users_db[un] = {'id':uid,'username':un,'nickname':nn,'avatar':''}
            tk = f'mk_{uid}_{int(time.time())}'
            sessions_db[tk] = un
            return self._json({'token':tk,'user':users_db[un]}, 201)

        elif self.path == '/api/auth/login':
            b = self._read(); un = b.get('username',''); pw = b.get('password','')
            u = users_db.get(un)
            if not u: return self._json({'error':'用户名或密码错误'},401)
            tk = f'mk_{u["id"]}_{int(time.time())}'
            sessions_db[tk] = un
            return self._json({'token':tk,'user':u})

        return self._json({'error':'Not found'},404)

httpd = http.server.HTTPServer(('0.0.0.0', PORT), H)
print(f"WebChat Preview: http://0.0.0.0:{PORT}", flush=True)
httpd.serve_forever()
