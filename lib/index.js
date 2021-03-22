"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiServer = exports.EmitResult = exports.registryEntry = exports.stringify = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* tslint:disable:no-expression-statement strict-type-predicates no-if-statement no-namespace */
var pond_1 = require("@actyx/pond");
var body_parser_1 = __importDefault(require("body-parser"));
var cors_1 = __importDefault(require("cors"));
var express_1 = __importDefault(require("express"));
var express_ws_1 = __importDefault(require("express-ws"));
var wsInterface_1 = require("./wsInterface");
exports.stringify = function (data) { return JSON.stringify(data, undefined, 2); };
exports.registryEntry = function (fish, props) { return ({
    fish: fish,
    props: props,
}); };
exports.EmitResult = {
    send: function (code, payload) { return ({
        code: code,
        payload: payload,
    }); },
};
var toEmitResult = function (result) { return __awaiter(void 0, void 0, void 0, function () {
    var promiseResult;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!result.hasOwnProperty('then')) return [3 /*break*/, 1];
                promiseResult = result;
                return [2 /*return*/, promiseResult];
            case 1: return [4 /*yield*/, Promise.resolve(result)];
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var bodyLimit = '20mb';
exports.ApiServer = function (config) {
    console.info('creating ApiServer');
    var pond = config.pond, allowEmit = config.allowEmit, registry = config.registry, eventEmitters = config.eventEmitters;
    var registryRouts = Object.entries(registry || {})
        .map(function (_a) {
        var key = _a[0], value = _a[1];
        console.log(key, typeof value.fish);
        var fishId = typeof value.fish === 'function' ? value.fish('{param}').fishId : value.fish.fishId;
        var route = typeof value.fish === 'function' ? "/state/" + key + "/{param}" : "/state/" + key;
        return [route, "FishId: " + fishId.entityType + " " + fishId.name];
    })
        .reduce(function (acc, _a) {
        var _b;
        var route = _a[0], value = _a[1];
        return (__assign(__assign({}, acc), (_b = {}, _b[route] = value, _b)));
    }, {});
    var emitRouts = Object.keys(eventEmitters || {}).map(function (name) { return "/emit/" + name; });
    var directEmitRoute = allowEmit
        ? 'Route to emit an event directly. Post call with JSON body: { tags: string[], payload: any }'
        : 'Direct emit not enabled (allowEmit != true)';
    var index = function () { return ({
        '/system/info': 'system information',
        '/system/pondState': 'fish jar state',
        '/system/sync': 'swarm sync state',
        '/system/connectivity': 'current swarm connectivity',
        '/emit': directEmitRoute,
        states: __assign({}, registryRouts),
        emitter: { info: 'POST call. Send event payload as JSON', routs: emitRouts },
    }); };
    var swarmSyncState = undefined;
    var syncDone = false;
    var nodeConnectivityState = undefined;
    pond.waitForSwarmSync({
        enabled: true,
        onProgress: function (s) { return (swarmSyncState = s); },
        onSyncComplete: function () { return (syncDone = true); },
    });
    pond.getNodeConnectivity({ callback: function (state) { return (nodeConnectivityState = state); } });
    var app = express_ws_1.default(express_1.default()).app;
    app.use(body_parser_1.default.urlencoded({ extended: false, limit: bodyLimit }));
    app.use(body_parser_1.default.json({ limit: bodyLimit }));
    app.use(cors_1.default());
    app.get('/', function (_req, res) { return res.send(index()); });
    app.get('/system/info', function (_req, res) {
        res.status(200).send(pond.info());
    });
    app.get('/system/pondState', function (_req, res) {
        pond.getPondState(function (state) {
            res.status(200).send(state);
        });
    });
    app.get('/system/sync', function (_req, res) {
        res.status(200).send({
            swarmSyncState: swarmSyncState,
            syncDone: syncDone,
        });
    });
    app.get('/system/connectivity', function (_req, res) {
        res.status(200).send(nodeConnectivityState);
    });
    if (allowEmit) {
        app.post('/emit', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var _a, tags, payload, axTag, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = req.body, tags = _a.tags, payload = _a.payload;
                        console.log(tags, payload);
                        if (!Array.isArray(tags) || tags.length === 0) {
                            res.status(403);
                            res.send({ message: "tags are invalid " + tags });
                            return [2 /*return*/];
                        }
                        //echo '{"tags": ["a", "b", "c"], "payload": "a"}' | curl -X "POST" -d @- -H "Content-Type: application/json"  localhost:4242/emit
                        if (payload === undefined) {
                            res.status(403);
                            res.send({ message: "payload is missing" });
                            return [2 /*return*/];
                        }
                        axTag = pond_1.Tags.apply(void 0, tags);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, pond.emit(axTag, payload).toPromise()];
                    case 2:
                        _b.sent();
                        res.sendStatus(204);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        res.status(500);
                        res.send(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    }
    if (registry) {
        // there are no type definitions for express-ws
        app.use('/state/:fish/:props?', function (req, res, next) {
            var _a = req.params, requestedFish = _a.fish, props = _a.props;
            var entry = registry[requestedFish];
            if (entry === undefined) {
                res.status(404);
                res.send({ message: "No fish registered for " + requestedFish });
                return;
            }
            var fish = entry.fish;
            if (typeof fish === 'function' && entry.props !== undefined && props !== undefined) {
                console.info("Ignoring parameter name=" + entry.props + " for fish " + fish + ", using " + props);
            }
            var finalProps = props !== undefined ? props : typeof fish === 'function' ? entry.props : fish.fishId.name;
            if (finalProps === undefined) {
                res.status(404);
                res.send({
                    message: "Missing properties for fish: " + (typeof fish === 'function' ? fish('props').fishId.entityType : fish.fishId.entityType),
                });
                return;
            }
            var fishCtx = { fish: fish, props: finalProps };
            // tslint:disable-next-line no-object-mutation
            res.locals = fishCtx;
            next();
        });
        app.get('/state/:fish/:props?', function (req, res) {
            var _a = req.params, requestedFish = _a.fish, requestedProps = _a.props;
            var _b = res.locals, fish = _b.fish, props = _b.props;
            console.log("http get connected: " + requestedFish + ", " + requestedProps);
            var fishToObserve = typeof fish === 'function' ? fish(props) : fish;
            var unSub = pond.observe(fishToObserve, function (state) {
                return setImmediate(function () {
                    unSub();
                    res.status(200);
                    res.send(state);
                });
            });
        });
        app.ws('/observe-state/:fish/:props?', function (ws, req) {
            var _a = req.params, requestedFish = _a.fish, props = _a.props;
            console.log("Ws connected: " + requestedFish + ", " + props);
            var entry = registry[requestedFish];
            if (entry === undefined) {
                console.log(entry);
                var message = "No fish registered for " + requestedFish;
                ws.send(wsInterface_1.mkError(requestedFish, props, message));
                ws.close();
                return;
            }
            var fish = entry.fish;
            if (typeof fish === 'function' && entry.props !== undefined && props !== undefined) {
                console.log('Ignoring parameter');
                console.info("Ignoring parameter name=" + entry.props + " for fish " + fish + ", using " + props);
            }
            var finalProps = props !== undefined ? props : typeof fish === 'function' ? entry.props : fish.fishId.name;
            if (finalProps === undefined) {
                console.log('Missing properties');
                var message = "Missing properties for fish: " + (typeof fish === 'function' ? fish('props').fishId.entityType : fish.fishId.entityType);
                ws.send(wsInterface_1.mkError(requestedFish, props, message));
                ws.close();
                return;
            }
            var fishToObserve = typeof fish === 'function' ? fish(finalProps) : fish;
            console.log('observe');
            var unSub = pond.observe(fishToObserve, function (state) {
                ws.send(JSON.stringify(wsInterface_1.mkData(requestedFish, props, state)), console.log);
            });
            ws.on('close', function (_) { return unSub(); });
            ws.on('error', function (_) { return unSub(); });
        });
    }
    if (eventEmitters) {
        app.post('/emit/:eventType', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var eventType, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        eventType = req.params.eventType;
                        return [4 /*yield*/, toEmitResult(eventEmitters[eventType](pond, req.body))];
                    case 1:
                        result = _a.sent();
                        if (result.payload) {
                            res.status(result.code).send(result.payload);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error("catch: internal error. '" + exports.stringify(req.body) + "': '" + error_1 + "'", req.body);
                        res.status(500).jsonp({ message: "" + error_1 });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    }
    // this can only be tested by actually opening a server socket!
    /* istanbul ignore next */
    if (config.endpoint) {
        var _a = config.endpoint, host = _a.host, port = _a.port;
        console.info('listening on %s:%s', host, port);
        app.listen(port, host);
    }
    else {
        console.info('listening on 4242');
        app.listen(4242);
    }
    return app;
};
