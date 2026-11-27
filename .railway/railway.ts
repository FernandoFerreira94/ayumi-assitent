import { defineRailway, github, group, image, postgres, project, redis, service, volume } from "railway/iac";

export default defineRailway(() => {
  const ayumiAssitent = github("FernandoFerreira94/ayumi-assitent", { branch: "main", checkSuites: false });

  const PostgresPVwb = postgres("Postgres-pVwb", { region: "us-east4-eqdc4a" });
  PostgresPVwb.networking = { privateNetworkEndpoint: "postgres-pvwb", tcpProxies: { "5432": {} } };
  const Postgres = postgres("Postgres", { region: "us-east4-eqdc4a" });
  Postgres.networking = { privateNetworkEndpoint: "postgres", tcpProxies: { "5432": {} } };
  const Redis = redis("Redis", { region: "us-east4-eqdc4a" });
  Redis.deploy = { startCommand: "/bin/sh -c \"rm -rf $RAILWAY_VOLUME_MOUNT_PATH/lost+found/ && exec docker-entrypoint.sh redis-server --requirepass $REDIS_PASSWORD --save 60 1 --dir $RAILWAY_VOLUME_MOUNT_PATH\"" };
  Redis.networking = { privateNetworkEndpoint: "redis", tcpProxies: { "6379": {} } };
  const redisVolume = volume("redis-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-east4-eqdc4a", sizeMB: 5000 });
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-east4-eqdc4a", sizeMB: 5000 });
  const postgresVolumeOV9S = volume("postgres-volume-oV9S", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-east4-eqdc4a", sizeMB: 5000 });
  const ayumiAssitent2 = service("ayumi-assitent", {
    source: ayumiAssitent,
    build: { buildCommand: "pnpm build", buildEnvironment: "V3", builder: "RAILPACK" },
    start: "pnpm db:migrate && pnpm start",
    healthcheck: "/api/health",
    healthcheckTimeout: 60,
    replicas: { "us-east4-eqdc4a": 1 },
    domains: ["app.bubbly.app.br"],
  });
  const distinguishedAcceptance = service("distinguished-acceptance", {
    source: ayumiAssitent,
    build: { buildCommand: "pnpm build", buildEnvironment: "V3", builder: "RAILPACK" },
    // Worker de filas (antes em railway.worker.json). Sem healthcheck: não serve HTTP.
    // Restart policy ALWAYS não existe no DSL de IaC; continua definida no painel do Railway.
    start: "pnpm worker",
    replicas: { "us-east4-eqdc4a": 1 },
  });
  const bubblySite = service("bubbly-site", {
    source: github("FernandoFerreira94/ayumi-assitent", { branch: "main", checkSuites: false, rootDirectory: "/site" }),
    // Site estático em Caddy: build e start vêm do Dockerfile (a imagem não tem pnpm).
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile", watchPatterns: ["/site/**"] },
    replicas: { "us-east4-eqdc4a": 1 },
    domains: ["bubbly.app.br", "www.bubbly.app.br"],
  });
  const EvolutionAPI = service("Evolution API", {
    source: image("evoapicloud/evolution-api:v2.3.7"),
    build: { buildEnvironment: "V3", builder: "RAILPACK" },
    replicas: { "us-east4-eqdc4a": 1 },
    networking: { privateNetworkEndpoint: "evolution-api" },
  });
  const WhatsAppAPISelfHostEvolutionAPINoMetaApprovalUpdatedNov26 = group("WhatsApp API — Self-Host Evolution API, No Meta Approval [Updated Nov'26]", [PostgresPVwb, Redis, EvolutionAPI]);

  return project("refreshing-rejoicing", {
    variables: { managed: false },
    resources: [ayumiAssitent2, distinguishedAcceptance, Postgres, bubblySite, redisVolume, postgresVolume, postgresVolumeOV9S, WhatsAppAPISelfHostEvolutionAPINoMetaApprovalUpdatedNov26],
  });
});
