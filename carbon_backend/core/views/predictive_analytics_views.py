"""
Predictive Analytics Views for Carbon Credits Platform
Handles API endpoints for carbon footprint forecasting, trip pattern analysis, and trend prediction
"""

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.utils import timezone
from ..predictive_analytics import PredictiveAnalyticsEngine

# Initialize the predictive analytics engine
analytics_engine = PredictiveAnalyticsEngine()

@csrf_exempt
@require_http_methods(["POST"])
@login_required
def train_user_model(request):
    """
    Train predictive model for user
    """
    try:
        user_id = request.user.id
        result = analytics_engine.train_carbon_forecast_model(user_id)
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
@login_required
def predict_carbon_savings(request):
    """
    Predict carbon savings for next N days
    """
    try:
        user_id = request.user.id
        days_ahead = int(request.GET.get('days', 7))
        
        if days_ahead < 1 or days_ahead > 30:
            return JsonResponse({
                'success': False,
                'error': 'Days ahead must be between 1 and 30'
            }, status=400)
        
        result = analytics_engine.predict_carbon_savings(user_id, days_ahead)
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
@login_required
def analyze_trip_patterns(request):
    """
    Analyze user's trip patterns and behaviors
    """
    try:
        user_id = request.user.id
        result = analytics_engine.analyze_trip_patterns(user_id)
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
@login_required
def predict_monthly_goals(request):
    """
    Predict if user will meet monthly carbon savings goals
    """
    try:
        user_id = request.user.id
        result = analytics_engine.predict_monthly_goals(user_id)
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
@login_required
def get_insights_and_recommendations(request):
    """
    Generate insights and recommendations based on predictive analysis
    """
    try:
        user_id = request.user.id
        result = analytics_engine.get_insights_and_recommendations(user_id)
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
def predictive_analytics_dashboard(request):
    """
    Predictive Analytics Dashboard view
    """
    return render(request, 'predictive_analytics/dashboard.html')

@csrf_exempt
@require_http_methods(["GET"])
@login_required
def get_analytics_overview(request):
    """
    Get comprehensive analytics overview for dashboard
    """
    try:
        user_id = request.user.id
        
        # Get all analytics data
        patterns_result = analytics_engine.analyze_trip_patterns(user_id)
        goals_result = analytics_engine.predict_monthly_goals(user_id)
        insights_result = analytics_engine.get_insights_and_recommendations(user_id)
        
        # Get prediction for next 7 days
        prediction_result = analytics_engine.predict_carbon_savings(user_id, days_ahead=7)
        
        overview = {
            'patterns': patterns_result,
            'goals': goals_result,
            'insights': insights_result,
            'predictions': prediction_result,
            'dashboard_generated_at': timezone.now().isoformat()
        }
        
        return JsonResponse({
            'success': True,
            'overview': overview
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
