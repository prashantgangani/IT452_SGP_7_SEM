import prisma from '../config/prisma.js';
import { adminInvitedDeals } from './dealController.js';

export const getPendingKyc = async (req, res, next) => {
    try {
        const pendingKycList = await prisma.kYC.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true, riskScore: true }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Pending KYC requests fetched successfully',
            data: pendingKycList
        });
    } catch (error) {
        next(error);
    }
};

export const getPendingLenderKyc = async (req, res, next) => {
    try {
        const pendingLenders = await prisma.lenderProfile.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Pending Lender KYC requests fetched successfully',
            data: pendingLenders
        });
    } catch (error) {
        next(error);
    }
};

export const approveKyc = async (req, res, next) => {
    try {
        const kycId = req.params.id;

        const result = await prisma.$transaction(async (tx) => {
            const kyc = await tx.kYC.update({
                where: { id: kycId },
                data: {
                    status: 'VERIFIED',
                    reviewedAt: new Date()
                }
            });

            await tx.user.update({
                where: { id: kyc.userId },
                data: { kycStatus: 'VERIFIED' }
            });

            return kyc;
        });

        res.status(200).json({
            success: true,
            message: 'KYC Approved Successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const rejectKyc = async (req, res, next) => {
    try {
        const kycId = req.params.id;
        const { adminRemark } = req.body;

        if (!adminRemark) {
            const error = new Error('Admin remark is required for rejection');
            error.name = 'ValidationError';
            throw error;
        }

        const result = await prisma.$transaction(async (tx) => {
            const kyc = await tx.kYC.update({
                where: { id: kycId },
                data: {
                    status: 'REJECTED',
                    adminRemark,
                    reviewedAt: new Date()
                }
            });

            await tx.user.update({
                where: { id: kyc.userId },
                data: { kycStatus: 'REJECTED' }
            });

            return kyc;
        });

        res.status(200).json({
            success: true,
            message: 'KYC Rejected Successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getDashboardStats = async (req, res, next) => {
    try {
        const totalMsmes = await prisma.user.count({ where: { role: 'MSME' } });
        const totalLenders = await prisma.user.count({ where: { role: 'LENDER' } });
        const totalInvoices = await prisma.invoice.count();

        const fundingAgg = await prisma.transaction.aggregate({
            _sum: { funded_amount: true },
            where: { status: 'COMPLETED' }
        });

        const totalFunding = fundingAgg._sum.funded_amount || 0;

        res.status(200).json({
            success: true,
            data: {
                totalMsmes,
                totalLenders,
                totalInvoices,
                totalFunding
            }
        });
    } catch (error) {
        next(error);
    }
};

export const approveLender = async (req, res, next) => {
    try {
        const id = req.params.id;

        const result = await prisma.$transaction(async (tx) => {
            const profile = await tx.lenderProfile.update({
                where: { id },
                data: {
                    verificationStatus: 'VERIFIED'
                }
            });

            await tx.user.update({
                where: { id: profile.userId },
                data: { kycStatus: 'VERIFIED' }
            });

            return profile;
        });

        res.status(200).json({
            success: true,
            message: 'Lender KYC Approved Successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const rejectLender = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { adminRemark } = req.body;

        if (!adminRemark) {
            const error = new Error('Admin remark is required for rejection');
            error.name = 'ValidationError';
            throw error;
        }

        const result = await prisma.$transaction(async (tx) => {
            const profile = await tx.lenderProfile.update({
                where: { id },
                data: {
                    verificationStatus: 'REJECTED',
                    adminRemark
                }
            });

            await tx.user.update({
                where: { id: profile.userId },
                data: { kycStatus: 'REJECTED' }
            });

            return profile;
        });

        res.status(200).json({
            success: true,
            message: 'Lender KYC Rejected Successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getAllRecordings = async (req, res, next) => {
    try {
        const recordings = await prisma.callSession.findMany({
            where: {
                OR: [
                    { recordingUrl: { not: null } },
                    { recordingUrl2: { not: null } },
                ],
            },
            include: {
                lender: { select: { name: true, email: true } },
                msme: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ success: true, data: recordings });
    } catch (error) {
        next(error);
    }
};

export const getAllDeals = async (req, res, next) => {
    try {
        const deals = await prisma.deal.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                invoice: { select: { invoice_number: true, due_date: true, amount: true } },
                lender: { select: { name: true, email: true } },
                msme: { select: { name: true, email: true } },
                callSession: { select: { id: true, status: true, startedAt: true } }
            }
        });

        const enrichedDeals = deals.map(deal => ({
            ...deal,
            adminInvited: adminInvitedDeals.has(deal.id)
        }));

        res.status(200).json({
            success: true,
            data: enrichedDeals
        });
    } catch (error) {
        next(error);
    }
};

const sendAdminData = (res, data) => res.status(200).json({ success: true, data });

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { created_at: 'desc' },
            select: { id: true, name: true, email: true, role: true, isActive: true, kycStatus: true, riskScore: true, created_at: true },
        });
        sendAdminData(res, users);
    } catch (error) { next(error); }
};

export const getAllInvoices = async (req, res, next) => {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                credit_score: true,
                risk_analysis: true,
            },
        });
        sendAdminData(res, invoices);
    } catch (error) { next(error); }
};

export const getAllBids = async (req, res, next) => {
    try {
        const [bids, offers] = await Promise.all([
            prisma.bid.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    lender: { select: { id: true, name: true, email: true } },
                    invoice: { select: { id: true, invoice_number: true, amount: true, user: { select: { name: true } } } },
                },
            }),
            prisma.fundingOffer.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    lender: { select: { id: true, name: true, email: true } },
                    invoice: { select: { id: true, invoice_number: true, amount: true, user: { select: { name: true } } } },
                }
            })
        ]);

        const mappedOffers = offers.map(o => ({
            id: o.id,
            invoice_id: o.invoiceId,
            lender_id: o.lenderId,
            interest_rate: o.interestRate,
            funding_percent: o.invoice?.amount ? Number(((Number(o.fundedAmount) / Number(o.invoice.amount)) * 100).toFixed(1)) : 100,
            status: o.status,
            created_at: o.createdAt,
            lender: o.lender,
            invoice: o.invoice
        }));

        const allBids = [...bids, ...mappedOffers].sort(
            (a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
        );

        sendAdminData(res, allBids);
    } catch (error) { next(error); }
};

export const getAllTransactions = async (req, res, next) => {
    try {
        const [transactions, deals] = await Promise.all([
            prisma.transaction.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    invoice: { select: { id: true, invoice_number: true, user: { select: { name: true } } } },
                },
            }),
            prisma.deal.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    invoice: { select: { id: true, invoice_number: true, user: { select: { name: true } } } },
                    lender: { select: { name: true } },
                    msme: { select: { name: true } }
                }
            })
        ]);

        const mappedDeals = deals.map(d => ({
            id: `TX-${d.id.slice(0, 8)}`,
            invoice_id: d.invoiceId,
            funded_amount: d.fundedAmount,
            interest: d.interestAmount,
            status: d.status === 'CLOSED' ? 'COMPLETED' : 'ACTIVE',
            created_at: d.createdAt,
            invoice: d.invoice
        }));

        const allTransactions = [...transactions, ...mappedDeals].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        sendAdminData(res, allTransactions);
    } catch (error) { next(error); }
};

export const getRiskAlerts = async (req, res, next) => {
    try {
        const [fraudFlags, riskAnalyses] = await Promise.all([
            prisma.fraudFlag.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    invoice: { select: { id: true, invoice_number: true } },
                },
            }),
            prisma.invoiceRiskAnalysis.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    invoice: {
                        include: {
                            user: { select: { id: true, name: true, email: true } }
                        }
                    }
                }
            })
        ]);

        const mappedRiskAnalyses = riskAnalyses.map(ra => {
            const fraudReasons = [];
            if (ra.breakdownJSON?.fraud) {
                Object.values(ra.breakdownJSON.fraud).forEach(item => {
                    if (item?.score > 0 && item?.reason) fraudReasons.push(item.reason);
                });
            }
            const reason = fraudReasons.length > 0
                ? fraudReasons.join(' • ')
                : `${ra.fraudRiskBand} Fraud Risk (${ra.fraudScore}/100) • ${ra.creditRiskBand}`;

            return {
                id: ra.id,
                invoiceId: ra.invoiceId,
                invoice: ra.invoice,
                user: ra.invoice?.user,
                reason,
                riskScore: ra.finalScore ?? ra.creditScore,
                createdAt: ra.createdAt
            };
        });

        const allAlerts = [...fraudFlags, ...mappedRiskAnalyses].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        sendAdminData(res, allAlerts);
    } catch (error) { next(error); }
};

export const verifyLenderChecklist = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const {
            isRbiVerified,
            isMcaVerified,
            isPanVerified,
            isBankVerified,
            verificationRemark
        } = req.body;

        const profile = await prisma.lenderProfile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Lender profile not found' });
        }

        const { lenderType } = profile;
        let isVerified = false;

        // Determine isVerified based on lenderType
        if (lenderType === 'BANK' || lenderType === 'NBFC') {
            isVerified = Boolean(isRbiVerified) && Boolean(isBankVerified);
        } else if (lenderType === 'REGISTERED_COMPANY' || lenderType === 'OTHER_FINANCIAL_ENTITY') {
            isVerified = Boolean(isMcaVerified) && Boolean(isBankVerified);
        } else if (lenderType === 'INDIVIDUAL_INVESTOR') {
            isVerified = Boolean(isPanVerified) && Boolean(isBankVerified);
        }

        const updatedProfile = await prisma.$transaction(async (tx) => {
            const up = await tx.lenderProfile.update({
                where: { userId },
                data: {
                    isRbiVerified: Boolean(isRbiVerified),
                    isMcaVerified: Boolean(isMcaVerified),
                    isPanVerified: Boolean(isPanVerified),
                    isBankVerified: Boolean(isBankVerified),
                    verificationRemark: verificationRemark || null,
                    isVerified
                }
            });

            // Sync user's kycStatus if lender verified successfully
            if (isVerified && profile.verificationStatus !== 'VERIFIED') {
                await tx.user.update({
                    where: { id: userId },
                    data: { kycStatus: 'VERIFIED' }
                });
                // Update the lenderProfile status to verified too to be consistent
                await tx.lenderProfile.update({
                    where: { userId },
                    data: { verificationStatus: 'VERIFIED' }
                });
            }

            return up;
        });

        res.status(200).json({
            success: true,
            message: isVerified ? 'Lender fully verified.' : 'Lender checklist updated.',
            data: updatedProfile
        });

    } catch (error) {
        next(error);
    }
};
