export namespace ai {
	
	export class Entity {
	    text: string;
	    label: string;
	    score: number;
	
	    static createFrom(source: any = {}) {
	        return new Entity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.text = source["text"];
	        this.label = source["label"];
	        this.score = source["score"];
	    }
	}
	export class Relation {
	    head: string;
	    tail: string;
	    label: string;
	    score: number;
	
	    static createFrom(source: any = {}) {
	        return new Relation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.head = source["head"];
	        this.tail = source["tail"];
	        this.label = source["label"];
	        this.score = source["score"];
	    }
	}

}

export namespace canva {
	
	export class CanvaClient {
	    ClientID: string;
	    ClientSecret: string;
	    AccessToken: string;
	    RefreshToken: string;
	
	    static createFrom(source: any = {}) {
	        return new CanvaClient(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ClientID = source["ClientID"];
	        this.ClientSecret = source["ClientSecret"];
	        this.AccessToken = source["AccessToken"];
	        this.RefreshToken = source["RefreshToken"];
	    }
	}

}

export namespace config {
	
	export class GitRemoteConfig {
	    remote_url: string;
	    branch: string;
	    username: string;
	    token: string;
	
	    static createFrom(source: any = {}) {
	        return new GitRemoteConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.remote_url = source["remote_url"];
	        this.branch = source["branch"];
	        this.username = source["username"];
	        this.token = source["token"];
	    }
	}
	export class LLMConfig {
	    provider: string;
	    url: string;
	    api_key: string;
	    model: string;
	    temperature: number;
	
	    static createFrom(source: any = {}) {
	        return new LLMConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.provider = source["provider"];
	        this.url = source["url"];
	        this.api_key = source["api_key"];
	        this.model = source["model"];
	        this.temperature = source["temperature"];
	    }
	}
	export class RecentCompendium {
	    path: string;
	    name: string;
	    // Go type: time
	    last_opened_at: any;
	
	    static createFrom(source: any = {}) {
	        return new RecentCompendium(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.last_opened_at = this.convertValues(source["last_opened_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Config {
	    last_compendium_path?: string;
	    last_opened_file?: string;
	    recent_compendiums?: RecentCompendium[];
	    auto_save_debounce_ms?: number;
	    // Go type: struct { UseLocal bool "json:\"use_local\""; Language string "json:\"language\""; Local struct { Model string "json:\"model\""; Threads int "json:\"threads\"" } "json:\"local\""; Remote struct { URL string "json:\"url\""; Model string "json:\"model\"" } "json:\"remote\"" }
	    whisper: any;
	    llm_url: string;
	    llm: LLMConfig;
	    git_remote: GitRemoteConfig;
	    kokoro_url: string;
	    recording_device: string;
	    audio_temp_path: string;
	    only_ttt: boolean;
	    // Go type: struct { ClientID string "json:\"client_id\""; ClientSecret string "json:\"client_secret\""; AccessToken string "json:\"access_token\""; RefreshToken string "json:\"refresh_token\"" }
	    canva: any;
	    // Go type: struct { UseLocal bool "json:\"use_local\""; ModelPath string "json:\"model_path\""; Threshold float32 "json:\"threshold\"" }
	    gliner: any;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.last_compendium_path = source["last_compendium_path"];
	        this.last_opened_file = source["last_opened_file"];
	        this.recent_compendiums = this.convertValues(source["recent_compendiums"], RecentCompendium);
	        this.auto_save_debounce_ms = source["auto_save_debounce_ms"];
	        this.whisper = this.convertValues(source["whisper"], Object);
	        this.llm_url = source["llm_url"];
	        this.llm = this.convertValues(source["llm"], LLMConfig);
	        this.git_remote = this.convertValues(source["git_remote"], GitRemoteConfig);
	        this.kokoro_url = source["kokoro_url"];
	        this.recording_device = source["recording_device"];
	        this.audio_temp_path = source["audio_temp_path"];
	        this.only_ttt = source["only_ttt"];
	        this.canva = this.convertValues(source["canva"], Object);
	        this.gliner = this.convertValues(source["gliner"], Object);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	

}

export namespace diagram {
	
	export class Edge {
	    source: string;
	    target: string;
	    label: string;
	
	    static createFrom(source: any = {}) {
	        return new Edge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.source = source["source"];
	        this.target = source["target"];
	        this.label = source["label"];
	    }
	}
	export class Node {
	    id: string;
	    label: string;
	    type: string;
	    x: number;
	    y: number;
	
	    static createFrom(source: any = {}) {
	        return new Node(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.type = source["type"];
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	}

}

export namespace git {
	
	export class CommitInfo {
	    hash: string;
	    short_hash: string;
	    message: string;
	    author_name: string;
	    author_email: string;
	    // Go type: time
	    timestamp: any;
	    date_str: string;
	
	    static createFrom(source: any = {}) {
	        return new CommitInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.short_hash = source["short_hash"];
	        this.message = source["message"];
	        this.author_name = source["author_name"];
	        this.author_email = source["author_email"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.date_str = source["date_str"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FileStatus {
	    path: string;
	    status: string;
	    staged: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.status = source["status"];
	        this.staged = source["staged"];
	    }
	}
	export class RemoteInfo {
	    name: string;
	    url: string;
	    current_branch: string;
	    ahead_count: number;
	    behind_count: number;
	    has_remote: boolean;
	
	    static createFrom(source: any = {}) {
	        return new RemoteInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	        this.current_branch = source["current_branch"];
	        this.ahead_count = source["ahead_count"];
	        this.behind_count = source["behind_count"];
	        this.has_remote = source["has_remote"];
	    }
	}

}

export namespace models {
	
	export class ModelInfo {
	    id: string;
	    name: string;
	    description: string;
	    category: string;
	    sizeMb: number;
	    isInstalled: boolean;
	    diskPath: string;
	    isBundle: boolean;
	    files: string[];
	
	    static createFrom(source: any = {}) {
	        return new ModelInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.sizeMb = source["sizeMb"];
	        this.isInstalled = source["isInstalled"];
	        this.diskPath = source["diskPath"];
	        this.isBundle = source["isBundle"];
	        this.files = source["files"];
	    }
	}

}

export namespace storage {
	
	export class AssetInfo {
	    id: string;
	    name: string;
	    relative_path: string;
	    category: string;
	    size_bytes: number;
	    size_formatted: string;
	    mod_time: string;
	    mime_type: string;
	    used_in_sessions: string[];
	    is_orphan: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AssetInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.relative_path = source["relative_path"];
	        this.category = source["category"];
	        this.size_bytes = source["size_bytes"];
	        this.size_formatted = source["size_formatted"];
	        this.mod_time = source["mod_time"];
	        this.mime_type = source["mime_type"];
	        this.used_in_sessions = source["used_in_sessions"];
	        this.is_orphan = source["is_orphan"];
	    }
	}
	export class AssetGallery {
	    assets: AssetInfo[];
	    total_assets: number;
	    total_bytes: number;
	    images_count: number;
	    audios_count: number;
	    docs_count: number;
	    orphans_count: number;
	
	    static createFrom(source: any = {}) {
	        return new AssetGallery(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.assets = this.convertValues(source["assets"], AssetInfo);
	        this.total_assets = source["total_assets"];
	        this.total_bytes = source["total_bytes"];
	        this.images_count = source["images_count"];
	        this.audios_count = source["audios_count"];
	        this.docs_count = source["docs_count"];
	        this.orphans_count = source["orphans_count"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class GraphEdge {
	    id: string;
	    source: string;
	    target: string;
	    label: string;
	    score: number;
	    source_files: string[];
	    is_unassigned: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GraphEdge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.source = source["source"];
	        this.target = source["target"];
	        this.label = source["label"];
	        this.score = source["score"];
	        this.source_files = source["source_files"];
	        this.is_unassigned = source["is_unassigned"];
	    }
	}
	export class GraphNode {
	    id: string;
	    label: string;
	    type: string;
	    source_files: string[];
	    occurrences: number;
	    first_introduced_in?: string;
	    is_unassigned: boolean;
	    x?: number;
	    y?: number;
	
	    static createFrom(source: any = {}) {
	        return new GraphNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.type = source["type"];
	        this.source_files = source["source_files"];
	        this.occurrences = source["occurrences"];
	        this.first_introduced_in = source["first_introduced_in"];
	        this.is_unassigned = source["is_unassigned"];
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	}
	export class ChapterGraph {
	    relative_path: string;
	    title: string;
	    nodes: GraphNode[];
	    edges: GraphEdge[];
	    // Go type: time
	    extracted_at: any;
	
	    static createFrom(source: any = {}) {
	        return new ChapterGraph(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.relative_path = source["relative_path"];
	        this.title = source["title"];
	        this.nodes = this.convertValues(source["nodes"], GraphNode);
	        this.edges = this.convertValues(source["edges"], GraphEdge);
	        this.extracted_at = this.convertValues(source["extracted_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GlossaryEntry {
	    id: string;
	    term: string;
	    definition: string;
	    introduced_in_session: string;
	    introduced_in_title: string;
	    occurrences: number;
	
	    static createFrom(source: any = {}) {
	        return new GlossaryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.term = source["term"];
	        this.definition = source["definition"];
	        this.introduced_in_session = source["introduced_in_session"];
	        this.introduced_in_title = source["introduced_in_title"];
	        this.occurrences = source["occurrences"];
	    }
	}
	export class CompendiumGlossary {
	    entries: GlossaryEntry[];
	    total_terms: number;
	
	    static createFrom(source: any = {}) {
	        return new CompendiumGlossary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.entries = this.convertValues(source["entries"], GlossaryEntry);
	        this.total_terms = source["total_terms"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProjectMeta {
	    id: string;
	    name: string;
	    description: string;
	    author: string;
	    email: string;
	    version: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    settings?: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ProjectMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.author = source["author"];
	        this.email = source["email"];
	        this.version = source["version"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.settings = source["settings"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CompendiumInfo {
	    path: string;
	    meta: ProjectMeta;
	    last_commit: string;
	    is_clean: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CompendiumInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.meta = this.convertValues(source["meta"], ProjectMeta);
	        this.last_commit = source["last_commit"];
	        this.is_clean = source["is_clean"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ContextSuggestions {
	    previous_concepts: GraphNode[];
	    global_concepts: GraphNode[];
	    prerequisite_suggestions: GraphEdge[];
	
	    static createFrom(source: any = {}) {
	        return new ContextSuggestions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.previous_concepts = this.convertValues(source["previous_concepts"], GraphNode);
	        this.global_concepts = this.convertValues(source["global_concepts"], GraphNode);
	        this.prerequisite_suggestions = this.convertValues(source["prerequisite_suggestions"], GraphEdge);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LintDiagnostic {
	    id: string;
	    severity: string;
	    code: string;
	    title: string;
	    description: string;
	    concept_id?: string;
	    concept_label?: string;
	    session_path?: string;
	    session_title?: string;
	    suggested_fix?: string;
	
	    static createFrom(source: any = {}) {
	        return new LintDiagnostic(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.severity = source["severity"];
	        this.code = source["code"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.concept_id = source["concept_id"];
	        this.concept_label = source["concept_label"];
	        this.session_path = source["session_path"];
	        this.session_title = source["session_title"];
	        this.suggested_fix = source["suggested_fix"];
	    }
	}
	export class CurriculumLintReport {
	    total_concepts: number;
	    total_edges: number;
	    total_sessions: number;
	    health_score: number;
	    error_count: number;
	    warning_count: number;
	    info_count: number;
	    diagnostics: LintDiagnostic[];
	    cycles_detected?: string[][];
	
	    static createFrom(source: any = {}) {
	        return new CurriculumLintReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_concepts = source["total_concepts"];
	        this.total_edges = source["total_edges"];
	        this.total_sessions = source["total_sessions"];
	        this.health_score = source["health_score"];
	        this.error_count = source["error_count"];
	        this.warning_count = source["warning_count"];
	        this.info_count = source["info_count"];
	        this.diagnostics = this.convertValues(source["diagnostics"], LintDiagnostic);
	        this.cycles_detected = source["cycles_detected"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MatrixCell {
	    type: string;
	    detail?: string;
	
	    static createFrom(source: any = {}) {
	        return new MatrixCell(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.detail = source["detail"];
	    }
	}
	export class MatrixConceptRow {
	    id: string;
	    label: string;
	    type: string;
	    introduced_in: string;
	    occurrences: number;
	    cells: Record<string, MatrixCell>;
	    warnings_count: number;
	
	    static createFrom(source: any = {}) {
	        return new MatrixConceptRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.type = source["type"];
	        this.introduced_in = source["introduced_in"];
	        this.occurrences = source["occurrences"];
	        this.cells = this.convertValues(source["cells"], MatrixCell, true);
	        this.warnings_count = source["warnings_count"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MatrixSessionHeader {
	    rel_path: string;
	    title: string;
	    module: string;
	    order: number;
	
	    static createFrom(source: any = {}) {
	        return new MatrixSessionHeader(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rel_path = source["rel_path"];
	        this.title = source["title"];
	        this.module = source["module"];
	        this.order = source["order"];
	    }
	}
	export class CurriculumMatrix {
	    sessions: MatrixSessionHeader[];
	    concepts: MatrixConceptRow[];
	    total_warnings: number;
	
	    static createFrom(source: any = {}) {
	        return new CurriculumMatrix(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sessions = this.convertValues(source["sessions"], MatrixSessionHeader);
	        this.concepts = this.convertValues(source["concepts"], MatrixConceptRow);
	        this.total_warnings = source["total_warnings"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FileNode {
	    name: string;
	    relative_path: string;
	    is_dir: boolean;
	    size: number;
	    // Go type: time
	    mod_time: any;
	    category: string;
	    children?: FileNode[];
	
	    static createFrom(source: any = {}) {
	        return new FileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.relative_path = source["relative_path"];
	        this.is_dir = source["is_dir"];
	        this.size = source["size"];
	        this.mod_time = this.convertValues(source["mod_time"], null);
	        this.category = source["category"];
	        this.children = this.convertValues(source["children"], FileNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class GraphData {
	    version: string;
	    // Go type: time
	    updated_at: any;
	    nodes: GraphNode[];
	    edges: GraphEdge[];
	
	    static createFrom(source: any = {}) {
	        return new GraphData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.nodes = this.convertValues(source["nodes"], GraphNode);
	        this.edges = this.convertValues(source["edges"], GraphEdge);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class JournalEntryInfo {
	    slug: string;
	    title: string;
	    path: string;
	    date: string;
	    related_session?: string;
	    summary?: string;
	    // Go type: time
	    mod_time: any;
	
	    static createFrom(source: any = {}) {
	        return new JournalEntryInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.slug = source["slug"];
	        this.title = source["title"];
	        this.path = source["path"];
	        this.date = source["date"];
	        this.related_session = source["related_session"];
	        this.summary = source["summary"];
	        this.mod_time = this.convertValues(source["mod_time"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class ModuleInfo {
	    slug: string;
	    title: string;
	    path: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ModuleInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.slug = source["slug"];
	        this.title = source["title"];
	        this.path = source["path"];
	        this.description = source["description"];
	    }
	}
	export class PlacementSuggestion {
	    topic_path: string;
	    topic_title: string;
	    suggested_module_slug: string;
	    suggested_module_title: string;
	    suggested_position: number;
	    suggested_after_session?: string;
	    suggested_before_session?: string;
	    prerequisites_met: string[];
	    dependent_sessions: string[];
	    reasoning: string;
	    confidence: number;
	
	    static createFrom(source: any = {}) {
	        return new PlacementSuggestion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.topic_path = source["topic_path"];
	        this.topic_title = source["topic_title"];
	        this.suggested_module_slug = source["suggested_module_slug"];
	        this.suggested_module_title = source["suggested_module_title"];
	        this.suggested_position = source["suggested_position"];
	        this.suggested_after_session = source["suggested_after_session"];
	        this.suggested_before_session = source["suggested_before_session"];
	        this.prerequisites_met = source["prerequisites_met"];
	        this.dependent_sessions = source["dependent_sessions"];
	        this.reasoning = source["reasoning"];
	        this.confidence = source["confidence"];
	    }
	}
	
	export class ResourceItem {
	    id: string;
	    name: string;
	    session_path: string;
	    session_title: string;
	    module: string;
	    is_checked: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ResourceItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.session_path = source["session_path"];
	        this.session_title = source["session_title"];
	        this.module = source["module"];
	        this.is_checked = source["is_checked"];
	    }
	}
	export class ResourceMatrix {
	    items: ResourceItem[];
	    total_items: number;
	
	    static createFrom(source: any = {}) {
	        return new ResourceMatrix(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], ResourceItem);
	        this.total_items = source["total_items"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScriptSection {
	    timestamp: string;
	    title: string;
	    speaker_notes: string;
	    visual_cue: string;
	    slide_text: string;
	
	    static createFrom(source: any = {}) {
	        return new ScriptSection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.title = source["title"];
	        this.speaker_notes = source["speaker_notes"];
	        this.visual_cue = source["visual_cue"];
	        this.slide_text = source["slide_text"];
	    }
	}
	export class SessionPacingReport {
	    word_count: number;
	    reading_minutes: number;
	    explanation_minutes: number;
	    student_activities_count: number;
	    student_activities_minutes: number;
	    workshop_count: number;
	    workshop_minutes: number;
	    total_minutes: number;
	    target_minutes: number;
	    pacing_status: string;
	    pacing_badge: string;
	    recommendation: string;
	
	    static createFrom(source: any = {}) {
	        return new SessionPacingReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.word_count = source["word_count"];
	        this.reading_minutes = source["reading_minutes"];
	        this.explanation_minutes = source["explanation_minutes"];
	        this.student_activities_count = source["student_activities_count"];
	        this.student_activities_minutes = source["student_activities_minutes"];
	        this.workshop_count = source["workshop_count"];
	        this.workshop_minutes = source["workshop_minutes"];
	        this.total_minutes = source["total_minutes"];
	        this.target_minutes = source["target_minutes"];
	        this.pacing_status = source["pacing_status"];
	        this.pacing_badge = source["pacing_badge"];
	        this.recommendation = source["recommendation"];
	    }
	}
	export class StructuredSessionDraft {
	    title: string;
	    objective: string;
	    theory_content: string;
	    key_concepts: string[];
	    student_questions: string[];
	    workshop_dynamics: string;
	    resources_list: string[];
	    commitment: string;
	    audio_rel_path?: string;
	    generated_asciidoc: string;
	
	    static createFrom(source: any = {}) {
	        return new StructuredSessionDraft(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.objective = source["objective"];
	        this.theory_content = source["theory_content"];
	        this.key_concepts = source["key_concepts"];
	        this.student_questions = source["student_questions"];
	        this.workshop_dynamics = source["workshop_dynamics"];
	        this.resources_list = source["resources_list"];
	        this.commitment = source["commitment"];
	        this.audio_rel_path = source["audio_rel_path"];
	        this.generated_asciidoc = source["generated_asciidoc"];
	    }
	}
	export class UnassignedTopicInfo {
	    relative_path: string;
	    title: string;
	    summary?: string;
	    nodes: GraphNode[];
	    edges: GraphEdge[];
	    readiness: string;
	    readiness_reason: string;
	    missing_prerequisites?: string[];
	    covered_prerequisites?: string[];
	    // Go type: time
	    mod_time: any;
	
	    static createFrom(source: any = {}) {
	        return new UnassignedTopicInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.relative_path = source["relative_path"];
	        this.title = source["title"];
	        this.summary = source["summary"];
	        this.nodes = this.convertValues(source["nodes"], GraphNode);
	        this.edges = this.convertValues(source["edges"], GraphEdge);
	        this.readiness = source["readiness"];
	        this.readiness_reason = source["readiness_reason"];
	        this.missing_prerequisites = source["missing_prerequisites"];
	        this.covered_prerequisites = source["covered_prerequisites"];
	        this.mod_time = this.convertValues(source["mod_time"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class VideoScriptData {
	    title: string;
	    estimated_total: string;
	    target_audience: string;
	    hook: string;
	    call_to_action: string;
	    sections: ScriptSection[];
	    raw_content?: string;
	
	    static createFrom(source: any = {}) {
	        return new VideoScriptData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.estimated_total = source["estimated_total"];
	        this.target_audience = source["target_audience"];
	        this.hook = source["hook"];
	        this.call_to_action = source["call_to_action"];
	        this.sections = this.convertValues(source["sections"], ScriptSection);
	        this.raw_content = source["raw_content"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class VoiceMemo {
	    id: string;
	    session_path: string;
	    title: string;
	    created_at: string;
	    audio_rel_path: string;
	    duration_seconds: number;
	
	    static createFrom(source: any = {}) {
	        return new VoiceMemo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.session_path = source["session_path"];
	        this.title = source["title"];
	        this.created_at = source["created_at"];
	        this.audio_rel_path = source["audio_rel_path"];
	        this.duration_seconds = source["duration_seconds"];
	    }
	}
	export class WizardCalendar {
	    start_date: string;
	    session_duration: number;
	    vacations?: string[];
	    milestones?: string[];
	
	    static createFrom(source: any = {}) {
	        return new WizardCalendar(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.start_date = source["start_date"];
	        this.session_duration = source["session_duration"];
	        this.vacations = source["vacations"];
	        this.milestones = source["milestones"];
	    }
	}
	export class WizardSession {
	    title: string;
	    week: number;
	    date?: string;
	    objectives?: string[];
	
	    static createFrom(source: any = {}) {
	        return new WizardSession(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.week = source["week"];
	        this.date = source["date"];
	        this.objectives = source["objectives"];
	    }
	}
	export class WizardModule {
	    slug: string;
	    title: string;
	    description: string;
	    year?: number;
	    session_count: number;
	    sessions?: WizardSession[];
	
	    static createFrom(source: any = {}) {
	        return new WizardModule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.slug = source["slug"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.year = source["year"];
	        this.session_count = source["session_count"];
	        this.sessions = this.convertValues(source["sessions"], WizardSession);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WizardTemplateBlock {
	    id: string;
	    title: string;
	    kind: string;
	    content: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new WizardTemplateBlock(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.kind = source["kind"];
	        this.content = source["content"];
	        this.enabled = source["enabled"];
	    }
	}
	export class WizardConfig {
	    target_dir: string;
	    name: string;
	    description: string;
	    author: string;
	    email: string;
	    horizon_type: string;
	    years: number;
	    duration_minutes: number;
	    include_instructor_notes: boolean;
	    include_student_notes: boolean;
	    template_blocks?: WizardTemplateBlock[];
	    modules: WizardModule[];
	    calendar: WizardCalendar;
	
	    static createFrom(source: any = {}) {
	        return new WizardConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target_dir = source["target_dir"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.author = source["author"];
	        this.email = source["email"];
	        this.horizon_type = source["horizon_type"];
	        this.years = source["years"];
	        this.duration_minutes = source["duration_minutes"];
	        this.include_instructor_notes = source["include_instructor_notes"];
	        this.include_student_notes = source["include_student_notes"];
	        this.template_blocks = this.convertValues(source["template_blocks"], WizardTemplateBlock);
	        this.modules = this.convertValues(source["modules"], WizardModule);
	        this.calendar = this.convertValues(source["calendar"], WizardCalendar);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	

}

export namespace updater {
	
	export class UpdateInfo {
	    available: boolean;
	    currentVersion: string;
	    latestVersion: string;
	    releaseNotes: string;
	    downloadUrl: string;
	    assetName: string;
	    assetSize: number;
	    publishedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.releaseNotes = source["releaseNotes"];
	        this.downloadUrl = source["downloadUrl"];
	        this.assetName = source["assetName"];
	        this.assetSize = source["assetSize"];
	        this.publishedAt = source["publishedAt"];
	    }
	}

}

