import CommissionSetting from "../models/commission.model";

const DEFAULT_COMMISSION_PERCENTAGE = 10;

const COMMISSION_SETTING_ID =
  "000000000000000000000001";

export interface UpdateCommissionSettingData {
  commissionPercentage: number;
  isActive: boolean;
}

export const getAdminCommissionSettingService =
  async () => {
    const setting =
      await CommissionSetting.findByIdAndUpdate(
        COMMISSION_SETTING_ID,
        {
          $setOnInsert: {
            commissionPercentage:
              DEFAULT_COMMISSION_PERCENTAGE,
            isActive: true,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    if (!setting) {
      throw new Error(
        "Unable to load commission settings."
      );
    }

    return setting;
  };

export const updateAdminCommissionSettingService =
  async (
    data: UpdateCommissionSettingData
  ) => {
    const setting =
      await CommissionSetting.findByIdAndUpdate(
        COMMISSION_SETTING_ID,
        {
          $set: {
            commissionPercentage:
              data.commissionPercentage,
            isActive: data.isActive,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    if (!setting) {
      throw new Error(
        "Unable to update commission settings."
      );
    }

    return setting;
  };

export const getActiveAdminCommissionPercentageService =
  async () => {
    const setting =
      await getAdminCommissionSettingService();

    if (!setting.isActive) {
      return 0;
    }

    return setting.commissionPercentage;
  };