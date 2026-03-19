import { addDays, format, subDays } from "date-fns";

import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

type StudioSeed = {
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  branding_color: string;
  positioning: "premium" | "mid" | "specialist";
};

type DemoUserSeed = {
  email: string;
  password: string;
  display_name: string;
  role: "owner" | "manager" | "staff";
};

const DEFAULT_PASSWORD = process.env.DEMO_DEFAULT_PASSWORD ?? "DemoPass123!";

const studios: StudioSeed[] = [
  {
    name: "BlackMirror Detailing",
    slug: "blackmirror",
    timezone: "America/Los_Angeles",
    currency: "USD",
    branding_color: "zinc",
    positioning: "premium",
  },
  {
    name: "UrbanGloss Studio",
    slug: "urbangloss",
    timezone: "America/New_York",
    currency: "USD",
    branding_color: "slate",
    positioning: "mid",
  },
  {
    name: "Apex Ceramic Lab",
    slug: "apex-ceramic",
    timezone: "Europe/London",
    currency: "GBP",
    branding_color: "neutral",
    positioning: "specialist",
  },
];

function cents(n: number) {
  return Math.round(n * 100);
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function int(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(p: number) {
  return Math.random() < p;
}

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function demoPhone(i: number) {
  const x = 1001 + (i % 8998);
  return `+1 555 010 ${String(x).padStart(4, "0")}`;
}

const namePool = {
  first: [
    "Aster",
    "Nova",
    "Orion",
    "Cedar",
    "Sol",
    "Lyra",
    "Mira",
    "Sable",
    "Riven",
    "Arden",
    "Kairo",
    "Vela",
    "Noor",
    "Talon",
    "Rowan",
    "Indigo",
    "Vale",
    "Ari",
    "Skye",
    "Kestrel",
  ],
  last: [
    "Vale",
    "Reed",
    "Quill",
    "Kade",
    "Nox",
    "Stone",
    "Hart",
    "Wren",
    "Hale",
    "Drift",
    "Pike",
    "Sage",
    "Crown",
    "Ash",
    "Frost",
    "North",
    "Wells",
    "Voss",
    "Gray",
    "Lane",
  ],
};

const carPool = {
  premium: {
    brands: ["BMW", "Porsche", "Mercedes-Benz", "Audi", "Lexus"],
    models: {
      BMW: ["3 Series", "5 Series", "X5", "X3"],
      Porsche: ["911", "Cayenne", "Macan", "Panamera"],
      "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE"],
      Audi: ["A4", "A6", "Q5", "Q7"],
      Lexus: ["ES", "RX", "NX", "IS"],
    } as Record<string, string[]>,
  },
  mid: {
    brands: ["Toyota", "Honda", "Mazda", "Hyundai", "Kia"],
    models: {
      Toyota: ["Camry", "RAV4", "Corolla", "Highlander"],
      Honda: ["Civic", "CR-V", "Accord", "Pilot"],
      Mazda: ["Mazda3", "CX-5", "CX-30", "Mazda6"],
      Hyundai: ["Elantra", "Tucson", "Santa Fe", "Sonata"],
      Kia: ["Sportage", "Sorento", "K5", "Seltos"],
    } as Record<string, string[]>,
  },
  specialist: {
    brands: ["Tesla", "BMW", "Porsche", "Mercedes-Benz", "Audi"],
    models: {
      Tesla: ["Model 3", "Model Y", "Model S"],
      BMW: ["M3", "M4", "X5"],
      Porsche: ["Taycan", "911", "Macan"],
      "Mercedes-Benz": ["AMG GT", "C-Class", "GLC"],
      Audi: ["RS5", "Q5", "A6"],
    } as Record<string, string[]>,
  },
};

const colors = [
  "Alpine White",
  "Jet Black",
  "Graphite",
  "Midnight Blue",
  "Silver",
  "Pearl",
  "Crimson",
  "Champagne",
  "Forest",
  "Slate",
];

const categories = [
  "sedan",
  "suv",
  "coupe",
  "pickup",
  "van",
  "supercar",
] as const;

const serviceTemplates = [
  {
    name: "Exterior Wash",
    description: "Premium hand wash, wheels, tire dressing, and quick protectant.",
    duration_minutes: 45,
    category: "wash",
    base: 49,
  },
  {
    name: "Interior Detailing",
    description: "Vacuum, wipe-down, plastics & leather care, and interior glass.",
    duration_minutes: 120,
    category: "interior",
    base: 149,
  },
  {
    name: "Paint Correction",
    description: "Single-stage machine polish to remove light defects and restore gloss.",
    duration_minutes: 240,
    category: "paint",
    base: 399,
  },
  {
    name: "Ceramic Coating",
    description: "Paint decontamination and durable ceramic coating application.",
    duration_minutes: 420,
    category: "coating",
    base: 899,
  },
  {
    name: "Engine Bay Cleaning",
    description: "Careful degrease and dress of engine bay surfaces.",
    duration_minutes: 60,
    category: "specialty",
    base: 99,
  },
  {
    name: "Glass Coating",
    description: "Hydrophobic coating for improved visibility and easier cleaning.",
    duration_minutes: 75,
    category: "coating",
    base: 129,
  },
  {
    name: "Premium Full Detail",
    description: "Exterior + interior detail with decontamination and protection.",
    duration_minutes: 300,
    category: "full",
    base: 349,
  },
];

function priceMultiplier(positioning: StudioSeed["positioning"]) {
  if (positioning === "premium") return 1.35;
  if (positioning === "specialist") return 1.45;
  return 1.0;
}

async function ensureDemoUser(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  seed: DemoUserSeed,
) {
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.data?.users?.find((u) => u.email === seed.email);

  if (existing) {
    const updated = await supabase.auth.admin.updateUserById(existing.id, {
      password: seed.password,
      email_confirm: true,
    });

    if (updated.error || !updated.data.user) {
      throw updated.error ?? new Error("Failed updating demo user password");
    }

    return updated.data.user;
  }

  const created = await supabase.auth.admin.createUser({
    email: seed.email,
    password: seed.password,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Failed creating demo user");
  }

  return created.data.user;
}

async function main() {
  const supabase = createSupabaseAdminClient();

  const seedAdminEmail = process.env.SEED_APP_ADMIN_EMAIL;

  const now = new Date();

  // Studios
  const studioSeeds = studios;

  for (const studio of studioSeeds) {
    const studioUpsert = await supabase
      .from("studios")
      .upsert(
        {
          slug: studio.slug,
          name: studio.name,
          timezone: studio.timezone,
          currency: studio.currency,
          branding_color: studio.branding_color,
          business_hours: {
            mon: { open: "09:00", close: "18:00" },
            tue: { open: "09:00", close: "18:00" },
            wed: { open: "09:00", close: "18:00" },
            thu: { open: "09:00", close: "18:00" },
            fri: { open: "09:00", close: "18:00" },
            sat: { open: "10:00", close: "16:00" },
            sun: { closed: true },
          },
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (studioUpsert.error || !studioUpsert.data) {
      throw studioUpsert.error ?? new Error("Failed upserting studio");
    }

    const studioId = studioUpsert.data.id as string;

    const directoryUpsert = await supabase.from("studio_directory").upsert(
      {
        studio_id: studioId,
        public_name: studio.name,
        is_active: true,
      },
      { onConflict: "studio_id" },
    );

    if (directoryUpsert.error) {
      throw directoryUpsert.error;
    }

    const demoUsers: DemoUserSeed[] = [
      {
        email: `owner.${studio.slug}@example.com`,
        password: DEFAULT_PASSWORD,
        display_name: "Owner",
        role: "owner",
      },
      {
        email: `manager.${studio.slug}@example.com`,
        password: DEFAULT_PASSWORD,
        display_name: "Manager",
        role: "manager",
      },
      {
        email: `staff.${studio.slug}@example.com`,
        password: DEFAULT_PASSWORD,
        display_name: "Staff",
        role: "staff",
      },
    ];

    const createdUsers = [] as { id: string; seed: DemoUserSeed }[];

    for (const du of demoUsers) {
      const user = await ensureDemoUser(supabase, du);
      createdUsers.push({ id: user.id, seed: du });
    }

    for (const u of createdUsers) {
      const up = await supabase.from("user_profiles").upsert(
        {
          id: u.id,
          studio_id: studioId,
          role: u.seed.role,
          display_name: `${studio.name} ${u.seed.display_name}`,
          membership_status: "active",
          requested_studio_id: null,
          requested_at: null,
          approved_at: new Date().toISOString(),
          approved_by: u.id,
        },
        { onConflict: "id" },
      );

      if (up.error) {
        throw up.error;
      }
    }

    const staffCount = studio.positioning === "mid" ? 8 : 6;
    const staff = [] as { id: string; display_name: string; role: any }[];

    const staffNames: string[] = [];
    while (staffNames.length < staffCount) {
      const n = `${pick(namePool.first)} ${pick(namePool.last)}`;
      if (!staffNames.includes(n)) staffNames.push(n);
    }

    for (let i = 0; i < staffCount; i++) {
      const display_name = staffNames[i]!;
      const role = i === 0 ? "manager" : "staff";

      const row = await supabase
        .from("staff_profiles")
        .insert({
          studio_id: studioId,
          user_id: i === 0 ? createdUsers[1]!.id : null,
          display_name,
          role,
          is_active: true,
          color: pick([
            "zinc",
            "slate",
            "stone",
            "neutral",
            "gray",
            "blue",
            "indigo",
          ]),
        })
        .select("id, display_name, role")
        .single();

      if (row.error || !row.data) {
        throw row.error ?? new Error("Failed inserting staff");
      }

      staff.push(row.data as any);
    }

    const multiplier = priceMultiplier(studio.positioning);

    const services = [] as {
      id: string;
      name: string;
      duration_minutes: number;
      base_price_cents: number;
      category: string;
    }[];

    for (const st of serviceTemplates) {
      const svc = await supabase
        .from("services")
        .upsert(
          {
            studio_id: studioId,
            name: st.name,
            description: st.description,
            duration_minutes: st.duration_minutes,
            base_price_cents: cents(st.base * multiplier),
            category: st.category,
            is_active: true,
          },
          { onConflict: "studio_id,name" },
        )
        .select("id, name, duration_minutes, base_price_cents, category")
        .single();

      if (svc.error || !svc.data) {
        throw svc.error ?? new Error("Failed upserting service");
      }

      services.push(svc.data as any);
    }

    const packagesSeed = [
      {
        name: "Essential",
        description: "Fast, clean reset for daily drivers: wash + interior refresh.",
        target_profile: "Daily driver maintenance",
        price: studio.positioning === "premium" ? 189 : 159,
        include: ["Exterior Wash", "Interior Detailing"],
      },
      {
        name: "Signature",
        description:
          "Studio-standard detail with decontamination and longer-lasting protection.",
        target_profile: "Enthusiast upkeep",
        price: studio.positioning === "premium" ? 349 : 299,
        include: ["Premium Full Detail", "Glass Coating"],
      },
      {
        name: "Elite",
        description:
          "Top-tier correction + coating prep path for maximum gloss and durability.",
        target_profile: "High-end vehicles and long-term protection",
        price: studio.positioning === "mid" ? 849 : 1199,
        include: ["Paint Correction", "Ceramic Coating", "Glass Coating"],
      },
    ];

    const packages = [] as { id: string; name: string; base_price_cents: number }[];

    for (const p of packagesSeed) {
      const pkg = await supabase
        .from("packages")
        .upsert(
          {
            studio_id: studioId,
            name: p.name,
            description: p.description,
            target_profile: p.target_profile,
            base_price_cents: cents(p.price * multiplier),
            is_active: true,
          },
          { onConflict: "studio_id,name" },
        )
        .select("id, name, base_price_cents")
        .single();

      if (pkg.error || !pkg.data) {
        throw pkg.error ?? new Error("Failed upserting package");
      }

      packages.push(pkg.data as any);

      const includedServiceIds = p.include
        .map((n) => services.find((s) => s.name === n)?.id)
        .filter(Boolean) as string[];

      for (const sid of includedServiceIds) {
        await supabase.from("package_items").upsert(
          {
            studio_id: studioId,
            package_id: pkg.data.id,
            service_id: sid,
            quantity: 1,
          },
          { onConflict: "package_id,service_id" },
        );
      }
    }

    const tags = ["VIP", "repeat", "inactive"];
    const tagRows: Record<string, string> = {};

    for (const t of tags) {
      const row = await supabase
        .from("customer_tags")
        .upsert({ studio_id: studioId, name: t }, { onConflict: "studio_id,name" })
        .select("id, name")
        .single();

      if (row.error || !row.data) {
        throw row.error ?? new Error("Failed creating tag");
      }

      tagRows[row.data.name] = row.data.id;
    }

    const customerCount = studio.positioning === "mid" ? 50 : 36;
    const customers = [] as { id: string; display_name: string }[];

    for (let i = 1; i <= customerCount; i++) {
      const display_name = `${pick(namePool.first)} ${pick(namePool.last)}`;
      const email = chance(0.35) ? `c${studio.slug}.${pad3(i)}@example.com` : null;
      const phone = chance(0.55) ? demoPhone(i) : null;

      const cRow = await supabase
        .from("customers")
        .insert({
          studio_id: studioId,
          display_name,
          email,
          phone,
          notes: chance(0.25)
            ? pick([
                "Prefers quick pickup windows.",
                "Sensitive to scents inside cabin.",
                "Wants paint to stay swirl-free; prefers microfiber-only drying.",
                "Requests extra attention on wheels.",
              ])
            : null,
        })
        .select("id, display_name")
        .single();

      if (cRow.error || !cRow.data) {
        throw cRow.error ?? new Error("Failed inserting customer");
      }

      customers.push(cRow.data as any);

      if (chance(0.12)) {
        await supabase.from("customer_tag_assignments").upsert(
          {
            studio_id: studioId,
            customer_id: cRow.data.id,
            tag_id: tagRows["VIP"]!,
          },
          { onConflict: "customer_id,tag_id" },
        );
      } else if (chance(0.25)) {
        await supabase.from("customer_tag_assignments").upsert(
          {
            studio_id: studioId,
            customer_id: cRow.data.id,
            tag_id: tagRows["repeat"]!,
          },
          { onConflict: "customer_id,tag_id" },
        );
      } else if (chance(0.08)) {
        await supabase.from("customer_tag_assignments").upsert(
          {
            studio_id: studioId,
            customer_id: cRow.data.id,
            tag_id: tagRows["inactive"]!,
          },
          { onConflict: "customer_id,tag_id" },
        );
      }
    }

    const cars = [] as {
      id: string;
      customer_id: string;
      brand: string;
      model: string;
      year: number;
      color: string;
      license_plate: string;
      category: any;
    }[];

    const carsPerCustomer = studio.positioning === "premium" ? [1, 2] : [1, 1, 2];

    let carIndex = 1;
    for (const c of customers) {
      const carCount = pick(carsPerCustomer);
      for (let j = 0; j < carCount; j++) {
        const pool =
          studio.positioning === "premium"
            ? carPool.premium
            : studio.positioning === "specialist"
              ? carPool.specialist
              : carPool.mid;

        const brand = pick(pool.brands);
        const model = pick(pool.models[brand] ?? ["Model"]);
        const year = int(2014, 2025);
        const color = pick(colors);
        const category = pick([...categories]);
        const license_plate = `DEMO-${studio.slug.toUpperCase().slice(0, 3)}-${pad3(
          carIndex,
        )}`;

        const carRow = await supabase
          .from("cars")
          .insert({
            studio_id: studioId,
            customer_id: c.id,
            brand,
            model,
            year,
            color,
            category,
            license_plate,
          })
          .select(
            "id, customer_id, brand, model, year, color, license_plate, category",
          )
          .single();

        if (carRow.error || !carRow.data) {
          throw carRow.error ?? new Error("Failed inserting car");
        }

        cars.push(carRow.data as any);
        carIndex++;
      }
    }

    const bookingCount = studio.positioning === "mid" ? 100 : 70;

    const statuses = [
      "booked",
      "arrived",
      "in_progress",
      "quality_check",
      "finished",
      "paid",
      "cancelled",
    ] as const;

    const statusWeights: Record<(typeof statuses)[number], number> = {
      booked: 0.18,
      arrived: 0.1,
      in_progress: 0.16,
      quality_check: 0.08,
      finished: 0.2,
      paid: 0.22,
      cancelled: 0.06,
    };

    function weightedStatus() {
      const r = Math.random();
      let acc = 0;
      for (const s of statuses) {
        acc += statusWeights[s];
        if (r <= acc) return s;
      }
      return "booked";
    }

    const startBase = subDays(now, 35);
    const endBase = addDays(now, 10);

    for (let i = 0; i < bookingCount; i++) {
      const customer = pick(customers);
      const car = pick(cars.filter((x) => x.customer_id === customer.id));
      const assignedStaff = chance(0.82) ? pick(staff) : null;

      const day = addDays(startBase, int(0, Math.max(1, Math.floor((endBase.getTime() - startBase.getTime()) / 86400000))));
      const booking_date = format(day, "yyyy-MM-dd");

      const startHour = studio.positioning === "mid" ? int(9, 17) : int(9, 16);
      const startMinute = pick([0, 0, 0, 15, 30, 45]);
      const start_time = `${String(startHour).padStart(2, "0")}:${String(
        startMinute,
      ).padStart(2, "0")}:00`;

      const usePackage = chance(0.38);
      const svc = usePackage ? null : pick(services);
      const pkg = usePackage ? pick(packages) : null;

      const basePriceCents = usePackage
        ? (pkg!.base_price_cents as number)
        : (svc!.base_price_cents as number);

      const price_cents = Math.max(
        cents(49),
        Math.round(basePriceCents * (chance(0.15) ? 0.9 : 1.0)),
      );

      const status = weightedStatus();

      const bookingRow = await supabase
        .from("bookings")
        .insert({
          studio_id: studioId,
          customer_id: customer.id,
          car_id: car.id,
          service_id: svc?.id ?? null,
          package_id: pkg?.id ?? null,
          staff_id: assignedStaff?.id ?? null,
          booking_date,
          start_time,
          end_time: null,
          status,
          price_cents,
          notes: chance(0.2)
            ? pick([
                "Focus on wheels and calipers.",
                "Please avoid high-gloss dressing.",
                "Owner requested minimal water use.",
                "Needs quick turnaround today.",
              ])
            : null,
        })
        .select("id")
        .single();

      if (bookingRow.error || !bookingRow.data) {
        throw bookingRow.error ?? new Error("Failed inserting booking");
      }

      await supabase.from("booking_status_history").insert({
        studio_id: studioId,
        booking_id: bookingRow.data.id,
        status,
        changed_by: createdUsers[1]!.id,
      });

      if (status === "paid") {
        await supabase.from("payments").insert({
          studio_id: studioId,
          booking_id: bookingRow.data.id,
          amount_cents: price_cents,
          method: pick(["card", "cash", "transfer"]),
        });
      }
    }
  }

  if (seedAdminEmail) {
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const user = list.data?.users?.find((u) => (u.email ?? "").toLowerCase() === seedAdminEmail.toLowerCase());
    if (user) {
      const ins = await supabase.from("app_admins").upsert({ user_id: user.id });
      if (ins.error) {
        throw ins.error;
      }
    }
  }
}

main()
  .then(() => {
    process.stdout.write("Seed completed\n");
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
