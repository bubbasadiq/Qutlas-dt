interface JobsServiceClient {
  reportHeartbeat: (req: any, cb: (err: any) => void) => void
  getNextJob: (req: any, cb: (err: any, res: any) => void) => void
  reportJobComplete: (req: any, cb: (err: any) => void) => void
  reportJobFailed: (req: any, cb: (err: any) => void) => void
}

interface MachineProfile {
  id: string
  type: "cnc-mill" | "laser" | "3d-printer" | "waterjet"
  status: "idle" | "busy" | "error"
  currentJob?: string
}

interface JobManifest {
  jobId: string
  customerId: string
  assetId: string
  machineType: string
  toolPath: Buffer
  estimatedTime: number
  materialSpec: string
}

class HubAgent {
  private hubId: string
  private machines: Map<string, MachineProfile> = new Map()
  private grpcClient: JobsServiceClient
  private jobQueue: JobManifest[] = []
  private telemetry: any = {}

  constructor(hubId: string, grpcUrl = "localhost:3002") {
    this.hubId = hubId

    // Creating mock client for development; use protoc-generated client in production
    this.grpcClient = {
      reportHeartbeat: (req, cb) => setTimeout(() => cb(null), 100),
      getNextJob: (req, cb) => setTimeout(() => cb(null, { job: null }), 100),
      reportJobComplete: (req, cb) => setTimeout(() => cb(null), 100),
      reportJobFailed: (req, cb) => setTimeout(() => cb(null), 100),
    }

    this.registerMachines()
    this.startHeartbeat()
    this.startJobPoller()
  }

  private registerMachines() {
    // Register hub machines
    this.machines.set("mill-001", { id: "mill-001", type: "cnc-mill", status: "idle" })
    this.machines.set("laser-001", { id: "laser-001", type: "laser", status: "idle" })
    console.log("[v0] Registered machines:", Array.from(this.machines.keys()))
  }

  private startHeartbeat() {
    setInterval(() => {
      const machines = Array.from(this.machines.values()).map((m) => ({
        machineId: m.id,
        type: m.type,
        status: m.status,
        currentJob: m.currentJob,
      }))

      this.grpcClient.reportHeartbeat(
        {
          hubId: this.hubId,
          timestamp: Date.now(),
          machines,
          cpuUsage: process.cpuUsage().user / 1000000,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        },
        (err: any) => {
          if (err) console.error("[v0] Heartbeat failed:", err.message)
        },
      )
    }, 5000) // Every 5 seconds
  }

  private startJobPoller() {
    setInterval(() => {
      this.grpcClient.getNextJob({ hubId: this.hubId }, (err: any, response: any) => {
        if (err) {
          console.error("[v0] Job poll failed:", err.message)
          return
        }

        if (response?.job) {
          this.queueJob(response.job)
        }
      })
    }, 2000) // Poll every 2 seconds
  }

  private queueJob(manifest: JobManifest) {
    this.jobQueue.push(manifest)
    console.log("[v0] Job queued:", manifest.jobId)

    if (this.jobQueue.length > 0 && this.hasAvailableMachine(manifest.machineType)) {
      this.executeNextJob()
    }
  }

  private hasAvailableMachine(machineType: string): boolean {
    for (const [, machine] of this.machines) {
      if (machine.type === machineType && machine.status === "idle") {
        return true
      }
    }
    return false
  }

  private async executeNextJob() {
    const manifest = this.jobQueue.shift()
    if (!manifest) return

    const machine = Array.from(this.machines.values()).find(
      (m) => m.type === manifest.machineType && m.status === "idle",
    )

    if (!machine) {
      this.jobQueue.unshift(manifest) // Re-queue
      return
    }

    machine.status = "busy"
    machine.currentJob = manifest.jobId

    console.log("[v0] Executing job:", manifest.jobId, "on machine:", machine.id)

    try {
      const startTime = Date.now()

      // Simulate CNC execution (in production, interface with actual CNC controller)
      await this.simulateCNCRun(manifest, machine.id)

      const endTime = Date.now()
      const cycleTime = (endTime - startTime) / 1000

      // Report job completion with telemetry
      this.grpcClient.reportJobComplete(
        {
          jobId: manifest.jobId,
          machineId: machine.id,
          status: "success",
          cycleTime,
          rejects: 0,
          toolChanges: 0,
          quality: {
            measuredDimensions: [100.1, 99.9, 50.0],
            tolerance: 0.1,
          },
        },
        (err: any) => {
          if (err) console.error("[v0] Job report failed:", err.message)
        },
      )

      machine.status = "idle"
      machine.currentJob = undefined

      // Process next job in queue
      if (this.jobQueue.length > 0) {
        this.executeNextJob()
      }
    } catch (error) {
      console.error("[v0] Job execution failed:", error)
      machine.status = "error"

      this.grpcClient.reportJobFailed(
        {
          jobId: manifest.jobId,
          machineId: machine.id,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        (err: any) => {
          if (err) console.error("[v0] Failure report failed:", err.message)
        },
      )
    }
  }

  private async simulateCNCRun(manifest: JobManifest, machineId: string): Promise<void> {
    // Placeholder: interface with actual CNC via CAM software or direct control
    // 1. Load tool path
    // 2. Load material
    // 3. Set machine parameters
    // 4. Run simulation
    // 5. Execute

    return new Promise((resolve) => {
      console.log(`[v0] Running CNC simulation for ${manifest.jobId}`)
      setTimeout(() => {
        console.log(`[v0] CNC run completed`)
        resolve()
      }, manifest.estimatedTime * 1000) // Simulate execution
    })
  }
}

// Start hub agent
const HUB_ID = process.env.HUB_ID || "hub-local-dev"
const agent = new HubAgent(HUB_ID)

console.log(`[v0] Hub Agent started for hub: ${HUB_ID}`)
