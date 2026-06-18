import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

type QaUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

type QaState = {
  owner: QaUser;
  member: QaUser;
  applicant: QaUser;
  stranger: QaUser;
  listingId: string;
  roomId: string;
  groupId: string;
  contractRoomId: string;
  contractFlatId: string;
  expenseId: string;
  joinRequestId: string;
};

const ENV_PATH = path.resolve(".env.local");

function loadLocalEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function requireEnv(name: string) {
  const value = process.env[name];
  test.skip(!value, `Falta ${name} para QA RLS contra Supabase`);
  return value as string;
}

function clientFor(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function createQaUser(admin: SupabaseClient, anonUrl: string, anonKey: string, tag: string): Promise<QaUser> {
  const password = "HabitusQa2026!";
  const email = `qa-${tag}-${Date.now()}-${Math.random().toString(16).slice(2)}@e2e.habitus.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error, `create user ${tag}`).toBeNull();
  const id = data.user?.id;
  expect(id, `auth id ${tag}`).toBeTruthy();

  const { error: profileError } = await admin.from("habitus_profiles").upsert({
    id,
    slug: `qa-${tag}-${id}`,
    display_name: `QA ${tag}`,
    account_role: tag === "owner" ? "propietario" : "inquilino",
    email,
    identity_status: "verified",
    onboarding_completed_at: new Date().toISOString(),
  });
  expect(profileError, `profile ${tag}`).toBeNull();

  const client = clientFor(anonUrl, anonKey);
  const { error: loginError } = await client.auth.signInWithPassword({ email, password });
  expect(loginError, `login ${tag}`).toBeNull();

  return { id: id as string, email, password, client };
}

async function setupQaData(admin: SupabaseClient, anonUrl: string, anonKey: string): Promise<QaState> {
  const owner = await createQaUser(admin, anonUrl, anonKey, "owner");
  const member = await createQaUser(admin, anonUrl, anonKey, "member");
  const applicant = await createQaUser(admin, anonUrl, anonKey, "applicant");
  const stranger = await createQaUser(admin, anonUrl, anonKey, "stranger");
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const { data: listing, error: listingError } = await admin
    .from("habitus_listings")
    .insert({
      slug: `qa-rls-listing-${stamp}`,
      name: "QA RLS Piso",
      location: "QA Street 1",
      city: "Madrid",
      price_monthly: 1200,
      currency: "EUR",
      owner_profile_id: owner.id,
      visibility: "private",
      status: "published",
    })
    .select("id")
    .single();
  expect(listingError).toBeNull();

  const { data: room, error: roomError } = await admin
    .from("habitus_rooms")
    .insert({
      listing_id: listing.id,
      name: "QA RLS Room",
      room_type: "individual",
      price_monthly: 500,
    })
    .select("id")
    .single();
  expect(roomError).toBeNull();

  const { data: group, error: groupError } = await admin
    .from("habitus_groups")
    .insert({
      slug: `qa-rls-group-${stamp}`,
      name: "QA RLS Grupo",
      creator_id: owner.id,
      city: "Madrid",
      target_members: 2,
    })
    .select("id")
    .single();
  expect(groupError).toBeNull();

  const { error: membersError } = await admin.from("habitus_group_members").insert([
    { group_id: group.id, profile_id: owner.id, role: "lead", is_confirmed: true },
    { group_id: group.id, profile_id: member.id, role: "member", is_confirmed: true },
  ]);
  expect(membersError).toBeNull();

  const { data: roomContract, error: roomContractError } = await admin
    .from("habitus_contratos_habitacion")
    .insert({
      habitacion_id: room.id,
      anfitrion_id: owner.id,
      inquilino_id: member.id,
      estado: "pendiente_firma",
      fecha_inicio: "2026-07-01",
      renta_mensual: 500,
      fianza_meses: 2,
      created_by: owner.id,
    })
    .select("id")
    .single();
  expect(roomContractError).toBeNull();

  const { data: flatContract, error: flatContractError } = await admin
    .from("habitus_contratos_piso")
    .insert({
      piso_id: listing.id,
      propietario_id: owner.id,
      grupo_id: group.id,
      estado: "pendiente_firma_grupos",
      fecha_inicio: "2026-07-01",
      renta_mensual: 1200,
      fianza_total: 2400,
      aceptaciones_miembros: {},
      created_by: owner.id,
    })
    .select("id")
    .single();
  expect(flatContractError).toBeNull();

  const { data: expense, error: expenseError } = await admin
    .from("habitus_gastos_piso")
    .insert({
      piso_id: listing.id,
      concepto: "QA Seguro",
      importe: 35,
      tipo: "fijo",
      periodicidad: "mensual",
      fecha: "2026-07-01",
      created_by: owner.id,
    })
    .select("id")
    .single();
  expect(expenseError).toBeNull();

  const { data: joinRequest, error: joinRequestError } = await admin
    .from("habitus_group_join_requests")
    .insert({
      grupo_id: group.id,
      solicitante_id: applicant.id,
      mensaje: "QA join",
      estado: "pending",
    })
    .select("id")
    .single();
  expect(joinRequestError).toBeNull();

  return {
    owner,
    member,
    applicant,
    stranger,
    listingId: listing.id,
    roomId: room.id,
    groupId: group.id,
    contractRoomId: roomContract.id,
    contractFlatId: flatContract.id,
    expenseId: expense.id,
    joinRequestId: joinRequest.id,
  };
}

async function cleanupQaData(admin: SupabaseClient, state?: QaState) {
  if (!state) return;
  await admin.from("contrato_estado_log").delete().in("contrato_id", [state.contractRoomId, state.contractFlatId]);
  await admin.from("habitus_group_join_requests").delete().eq("grupo_id", state.groupId);
  await admin.from("habitus_gastos_piso").delete().eq("piso_id", state.listingId);
  await admin.from("habitus_contratos_piso").delete().eq("id", state.contractFlatId);
  await admin.from("habitus_contratos_habitacion").delete().eq("id", state.contractRoomId);
  await admin.from("habitus_group_members").delete().eq("group_id", state.groupId);
  await admin.from("habitus_groups").delete().eq("id", state.groupId);
  await admin.from("habitus_rooms").delete().eq("id", state.roomId);
  await admin.from("habitus_listings").delete().eq("id", state.listingId);
  for (const user of [state.owner, state.member, state.applicant, state.stranger]) {
    await admin.from("habitus_profiles").delete().eq("id", user.id);
    await admin.auth.admin.deleteUser(user.id).catch(() => {});
  }
}

test.describe("Contratos, gastos y grupos — auditoría RLS real", () => {
  let admin: SupabaseClient;
  let anon: SupabaseClient;
  let state: QaState | undefined;

  test.beforeAll(async () => {
    loadLocalEnv();
    const url = requireEnv("VITE_SUPABASE_URL");
    const anonKey = requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    admin = clientFor(url, serviceKey);
    anon = clientFor(url, anonKey);
    state = await setupQaData(admin, url, anonKey);
  });

  test.afterAll(async () => {
    await cleanupQaData(admin, state);
  });

  test("bloquea anon y usuarios ajenos, permite partes legítimas", async () => {
    expect(state).toBeTruthy();
    const s = state as QaState;

    const { error: anonRpcError } = await anon.rpc("aceptar_contrato_piso_miembro", {
      p_contrato_id: s.contractFlatId,
      p_user_id: s.member.id,
    });
    expect(anonRpcError?.message).toMatch(/permission denied|not authorized|No autorizado/i);

    const { data: strangerContracts, error: strangerContractsError } = await s.stranger.client
      .from("habitus_contratos_habitacion")
      .select("id")
      .eq("id", s.contractRoomId);
    expect(strangerContractsError).toBeNull();
    expect(strangerContracts).toEqual([]);

    const { data: ownerContracts, error: ownerContractsError } = await s.owner.client
      .from("habitus_contratos_habitacion")
      .select("id")
      .eq("id", s.contractRoomId);
    expect(ownerContractsError).toBeNull();
    expect(ownerContracts).toHaveLength(1);

    const { data: strangerExpense, error: strangerExpenseError } = await s.stranger.client
      .from("habitus_gastos_piso")
      .select("id")
      .eq("id", s.expenseId);
    expect(strangerExpenseError).toBeNull();
    expect(strangerExpense).toEqual([]);

    const { error: spoofAcceptError } = await s.stranger.client.rpc("aceptar_contrato_piso_miembro", {
      p_contrato_id: s.contractFlatId,
      p_user_id: s.member.id,
    });
    expect(spoofAcceptError?.message).toMatch(/No autorizado|permission denied/i);
  });

  test("miembro acepta contrato, trigger crea audit log visible solo a partes", async () => {
    expect(state).toBeTruthy();
    const s = state as QaState;

    const { data: acceptResult, error: acceptError } = await s.member.client.rpc("aceptar_contrato_piso_miembro", {
      p_contrato_id: s.contractFlatId,
      p_user_id: s.member.id,
    });
    expect(acceptError).toBeNull();
    expect(acceptResult?.success).toBe(true);

    const { data: ownerAcceptResult, error: ownerAcceptError } = await s.owner.client.rpc("aceptar_contrato_piso_miembro", {
      p_contrato_id: s.contractFlatId,
      p_user_id: s.owner.id,
    });
    expect(ownerAcceptError).toBeNull();
    expect(ownerAcceptResult?.estado).toBe("activo");

    const { data: ownerLog, error: ownerLogError } = await s.owner.client
      .from("contrato_estado_log")
      .select("contrato_id,estado_nuevo")
      .eq("contrato_id", s.contractFlatId);
    expect(ownerLogError).toBeNull();
    expect(ownerLog?.some((row) => row.estado_nuevo === "activo")).toBe(true);

    const { data: strangerLog, error: strangerLogError } = await s.stranger.client
      .from("contrato_estado_log")
      .select("id")
      .eq("contrato_id", s.contractFlatId);
    expect(strangerLogError).toBeNull();
    expect(strangerLog).toEqual([]);
  });

  test("solo líder aprueba solicitudes y solicitante queda miembro", async () => {
    expect(state).toBeTruthy();
    const s = state as QaState;

    const { error: nonLeaderError } = await s.member.client.rpc("aprobar_group_join_request", {
      p_request_id: s.joinRequestId,
      p_leader_id: s.member.id,
    });
    expect(nonLeaderError?.message).toMatch(/Solo el líder|Solicitud no encontrada|permission denied|No autorizado/i);

    const { data: approved, error: leaderError } = await s.owner.client.rpc("aprobar_group_join_request", {
      p_request_id: s.joinRequestId,
      p_leader_id: s.owner.id,
    });
    expect(leaderError).toBeNull();
    expect(approved?.success).toBe(true);

    const { data: membership, error: membershipError } = await s.applicant.client
      .from("habitus_group_members")
      .select("group_id,profile_id,is_confirmed")
      .eq("group_id", s.groupId)
      .eq("profile_id", s.applicant.id)
      .single();
    expect(membershipError).toBeNull();
    expect(membership?.is_confirmed).toBe(true);
  });

  test("histórico de ingresos no permite consultar otro propietario", async () => {
    expect(state).toBeTruthy();
    const s = state as QaState;

    const { data: ownerHistory, error: ownerHistoryError } = await s.owner.client.rpc("propietario_historico_ingresos", {
      p_propietario_id: s.owner.id,
      p_meses: 2,
    });
    expect(ownerHistoryError).toBeNull();
    expect(Array.isArray(ownerHistory)).toBe(true);

    const { error: strangerHistoryError } = await s.stranger.client.rpc("propietario_historico_ingresos", {
      p_propietario_id: s.owner.id,
      p_meses: 2,
    });
    expect(strangerHistoryError?.message).toMatch(/No autorizado|permission denied/i);
  });
});
