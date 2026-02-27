import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    permissions: {
      dashboard: {
        view: { type: Boolean, default: false },
      },

      sales: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      salesOrder: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      purchase: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      production: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      beam: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      inventory: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      qc: {
        view: { type: Boolean, default: false },
        approve: { type: Boolean, default: false },
        reject: { type: Boolean, default: false },
      },

      accounts: {
        view: { type: Boolean, default: false },
        createInvoice: { type: Boolean, default: false },
        manageLedger: { type: Boolean, default: false },
      },

      payroll: {
        view: { type: Boolean, default: false },
        generate: { type: Boolean, default: false },
        manage: { type: Boolean, default: false },
      },

      jobWork: {
        view: { type: Boolean, default: false },
        issue: { type: Boolean, default: false },
        receive: { type: Boolean, default: false },
      },

      dispatch: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      reports: {
        view: { type: Boolean, default: false },
        generate: { type: Boolean, default: false },
        export: { type: Boolean, default: false },
      },

      settings: {
        manageUsers: { type: Boolean, default: false },
        manageRoles: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
